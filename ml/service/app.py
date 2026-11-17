"""FastAPI image classification for Food50 and staged Food100.

Food100 is the staging default when its packaged shards exist.
Set FOOD_MODEL_VARIANT=50 to force the old model for rollback.
MODEL_DIR overrides both for tests and custom deployments.
"""
import io
import json
import os
import sys
import tempfile
from pathlib import Path

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps, UnidentifiedImageError

ML_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ML_ROOT.parent))
from ml.assemble_food100 import assemble_model  # noqa: E402

DEFAULT_DIR = ML_ROOT / "models"
STAGING_DIR = ML_ROOT / "models_food100"
MODEL_VARIANT = os.environ.get("FOOD_MODEL_VARIANT", "100" if STAGING_DIR.is_dir() else "50")
if MODEL_VARIANT not in ("50", "100"):
    raise RuntimeError("FOOD_MODEL_VARIANT must be either 50 or 100")
MODEL_DIR = Path(os.environ.get(
    "MODEL_DIR",
    str(STAGING_DIR if MODEL_VARIANT == "100" else DEFAULT_DIR),
))
MIN_CONF = float(os.environ.get("MIN_CONF", "0.5"))
TOP2_GAP_THRESHOLD = 0.10
MAX_BYTES = 8 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000


def _load_classes(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(data, list):
        labels = data
    elif isinstance(data, dict) and isinstance(data.get("classes"), list):
        labels = data["classes"]
    elif isinstance(data, dict) and all(str(k).isdigit() for k in data):
        keys = sorted(int(k) for k in data)
        if keys != list(range(len(keys))):
            raise RuntimeError("Numeric label indexes must be contiguous from zero")
        labels = [data[str(k)] for k in keys]
    elif isinstance(data, dict) and all(isinstance(v, int) for v in data.values()):
        indexes = sorted(data.values())
        if indexes != list(range(len(indexes))):
            raise RuntimeError("Label indexes must be contiguous from zero")
        labels = [name for name, _ in sorted(data.items(), key=lambda kv: kv[1])]
    else:
        raise RuntimeError("Unsupported classes.json format")
    if (
        not isinstance(labels, list)
        or not labels
        or not all(isinstance(label, str) and label.strip() for label in labels)
        or len(labels) != len(set(labels))
    ):
        raise RuntimeError("Invalid or duplicate classes in classes.json")
    return labels


CLASSES = _load_classes(MODEL_DIR / "classes.json")
model_file = MODEL_DIR / "food_classifier.onnx"
if not model_file.is_file() and (MODEL_DIR / "parts").is_dir():
    # Vercel/Render source tree can be read-only. Keep a checked assembled copy in /tmp.
    model_file = assemble_model(
        MODEL_DIR,
        Path(tempfile.gettempdir()) / "nutrivn-food100" / "food_classifier.onnx",
    )

sess = ort.InferenceSession(str(model_file), providers=["CPUExecutionProvider"])
MODEL_INPUT_NAME = sess.get_inputs()[0].name
shape = sess.get_outputs()[0].shape
if isinstance(shape[-1], int) and shape[-1] != len(CLASSES):
    raise RuntimeError(f"ONNX outputs {shape[-1]} classes, labels file contains {len(CLASSES)}")

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

app = FastAPI(title="Food recognition service")
# Same-origin frontend needs no CORS. Explicitly allow local development by default;
# set ALLOWED_ORIGINS=https://your-frontend.example for a separate Render API.
allowed_origins = [
    origin.strip() for origin in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def preprocess(image: Image.Image) -> np.ndarray:
    rgb = ImageOps.exif_transpose(image).convert("RGB")
    if len(CLASSES) == 100:
        # Matches torchvision.transforms.Resize(256), CenterCrop(224) exactly:
        # integer floor for resized long side; center crop.
        w, h = rgb.size
        if w <= h:
            new_w, new_h = 256, int(256 * h / w)
        else:
            new_w, new_h = int(256 * w / h), 256
        rgb = rgb.resize((new_w, new_h), Image.Resampling.BILINEAR)
        left, top = (new_w - 224) // 2, (new_h - 224) // 2
        rgb = rgb.crop((left, top, left + 224, top + 224))
    else:
        # Existing Food50 was trained with direct 224px resize.
        rgb = rgb.resize((224, 224), Image.Resampling.BILINEAR)

    x = np.asarray(rgb, dtype=np.float32) / 255.0
    return ((x - MEAN) / STD).transpose(2, 0, 1)[None].astype(np.float32)


@app.get("/health")
def health():
    return {"ok": True, "class_count": len(CLASSES), "classes": CLASSES}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type and file.content_type.lower() not in {
        "image/jpeg", "image/png", "image/webp", "image/bmp"
    }:
        raise HTTPException(415, "Unsupported image type")
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image too large (max 8 MiB)")
    try:
        with Image.open(io.BytesIO(data)) as original:
            if original.width * original.height > MAX_IMAGE_PIXELS:
                raise HTTPException(413, "Image dimensions too large")
            original.verify()
        with Image.open(io.BytesIO(data)) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
    except HTTPException:
        raise
    except (OSError, ValueError, UnidentifiedImageError, Image.DecompressionBombError):
        raise HTTPException(400, "Invalid or unreadable image")

    logits = np.asarray(sess.run(None, {MODEL_INPUT_NAME: preprocess(image)})[0]).reshape(-1)
    if logits.size != len(CLASSES) or not np.isfinite(logits).all():
        raise HTTPException(500, "Model output shape or values are invalid")
    p = np.exp(logits - logits.max())
    p /= p.sum()
    top = np.argsort(p)[::-1][:3]
    top1_prob = float(p[top[0]])
    top2_prob = float(p[top[1]]) if len(top) > 1 else 0.0
    gap = top1_prob - top2_prob
    ambiguous = len(top) > 1 and gap < TOP2_GAP_THRESHOLD
    return {
        "can_xac_nhan": bool(ambiguous),
        "chenh_lech_top2": round(gap, 3),
        "ly_do_xac_nhan": "top_two_close" if ambiguous else None,
        "mon": CLASSES[top[0]],
        "do_tin_cay": round(top1_prob, 3),
        "chac_chan": bool(top1_prob >= MIN_CONF and not ambiguous),
        "top3": [{"mon": CLASSES[i], "do_tin_cay": round(float(p[i]), 3)} for i in top],
        "has_nutrition_data": False,
    }
