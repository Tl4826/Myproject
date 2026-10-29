"""Model service: POST /predict (image) -> dish name. Run: uvicorn app:app --port 8000"""
import io, json, os
from pathlib import Path

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image

MODEL_DIR = Path(os.environ.get("MODEL_DIR", Path(__file__).parent.parent / "models"))
MIN_CONF = float(os.environ.get("MIN_CONF", 0.5))  # below this, "chac_chan" is false

sess = ort.InferenceSession(str(MODEL_DIR / "food_classifier.onnx"), providers=["CPUExecutionProvider"])
CLASSES = json.loads((MODEL_DIR / "classes.json").read_text())["classes"]
MEAN, STD = np.array([0.485, 0.456, 0.406], "f4"), np.array([0.229, 0.224, 0.225], "f4")

app = FastAPI(title="Food recognition service")


def preprocess(img: Image.Image) -> np.ndarray:
    # same as training: resize shorter side 256, center crop 224, /255, normalise
    w, h = img.size
    s = 256 / min(w, h)
    img = img.resize((max(256, round(w * s)), max(256, round(h * s))), Image.BILINEAR)
    w, h = img.size
    l, t = (w - 224) // 2, (h - 224) // 2
    x = np.asarray(img.crop((l, t, l + 224, t + 224)), "f4") / 255.0
    return ((x - MEAN) / STD).transpose(2, 0, 1)[None]


@app.get("/health")
def health():
    return {"ok": True, "classes": CLASSES}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except Exception:
        raise HTTPException(400, "not a valid image")
    logits = sess.run(None, {"image": preprocess(img)})[0][0]
    p = np.exp(logits - logits.max()); p /= p.sum()
    top = np.argsort(p)[::-1][:3]
    return {
        "mon": CLASSES[top[0]],
        "do_tin_cay": round(float(p[top[0]]), 3),
        "chac_chan": bool(p[top[0]] >= MIN_CONF),
        "top3": [{"mon": CLASSES[i], "do_tin_cay": round(float(p[i]), 3)} for i in top],
    }
