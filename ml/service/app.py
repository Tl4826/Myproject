"""Model service: POST /predict (image) -> dish name. Run: uvicorn app:app --port 8000"""
import io, json, os
from pathlib import Path

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

MODEL_DIR = Path(os.environ.get("MODEL_DIR", Path(__file__).parent.parent / "models"))
MIN_CONF = float(os.environ.get("MIN_CONF", 0.5))  # below this, "chac_chan" is false
TOP2_GAP_THRESHOLD = 0.10  # 10 percentage points, not a relative percent
MAX_BYTES = 8 * 1024 * 1024  # public deploy: reject huge uploads

sess = ort.InferenceSession(str(MODEL_DIR / "food_classifier.onnx"), providers=["CPUExecutionProvider"])
# Accept the existing {"classes": [...]} format and the new Colab list format.
class_data = json.loads((MODEL_DIR / "classes.json").read_text(encoding="utf-8"))
CLASSES = class_data["classes"] if isinstance(class_data, dict) else class_data
if not isinstance(CLASSES, list) or not CLASSES or not all(isinstance(x, str) for x in CLASSES):
    raise RuntimeError("classes.json must contain a non-empty list of class names")
# Ensure the labels and the ONNX output dimension agree before serving requests.
output_shape = sess.get_outputs()[0].shape
if isinstance(output_shape[-1], int) and output_shape[-1] != len(CLASSES):
    raise RuntimeError(f"ONNX outputs {output_shape[-1]} classes but classes.json has {len(CLASSES)}")
MEAN, STD = np.array([0.485, 0.456, 0.406], "f4"), np.array([0.229, 0.224, 0.225], "f4")

app = FastAPI(title="Food recognition service")
# shortcut: allow any origin so the demo frontend can call us, restrict to the real site when deployed
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def preprocess(img: Image.Image) -> np.ndarray:
    # Food50 training/evaluation: direct 224x224 resize, no center crop.
    # Keep the legacy 12-class preprocessing for backward compatibility.
    if len(CLASSES) == 50:
        img = img.resize((224, 224), Image.BILINEAR)
    else:
        w, h = img.size
        scale = 256 / min(w, h)
        img = img.resize(
            (max(256, round(w * scale)), max(256, round(h * scale))),
            Image.BILINEAR,
        )
        w, h = img.size
        left, top = (w - 224) // 2, (h - 224) // 2
        img = img.crop((left, top, left + 224, top + 224))
    x = np.asarray(img, dtype=np.float32) / 255.0
    return ((x - MEAN) / STD).transpose(2, 0, 1)[None]


@app.get("/health")
def health():
    return {"ok": True, "classes": CLASSES}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "image too large (max 8 MB)")
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        raise HTTPException(400, "not a valid image")
    logits = sess.run(None, {"image": preprocess(img)})[0][0]
    p = np.exp(logits - logits.max()); p /= p.sum()
    top = np.argsort(p)[::-1][:3]
    # A near tie is ambiguous even when the top class exceeds MIN_CONF.
    top1_prob, top2_prob = float(p[top[0]]), float(p[top[1]]) if len(top) > 1 else 0.0
    gap = top1_prob - top2_prob
    ambiguous = len(top) > 1 and gap < TOP2_GAP_THRESHOLD
    return {
        "can_xac_nhan": bool(ambiguous),
        "chenh_lech_top2": round(gap, 3),
        "ly_do_xac_nhan": "top_two_close" if ambiguous else None,
        "mon": CLASSES[top[0]],
        "do_tin_cay": round(float(p[top[0]]), 3),
        "chac_chan": bool(p[top[0]] >= MIN_CONF),
        "top3": [{"mon": CLASSES[i], "do_tin_cay": round(float(p[i]), 3)} for i in top],
    }
