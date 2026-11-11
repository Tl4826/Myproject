"""Self-check with a tiny fake model (no real weights needed): python -m pytest test_app.py"""
import io, json, os, tempfile
import numpy as np, onnx
from onnx import TensorProto as T, helper as h, numpy_helper as nh

CLASSES = ["a", "b", "c"]
d = tempfile.mkdtemp()
# fake model: logits = mean RGB (3 values) -> class k = channel k, so a red image -> "a"
g = h.make_graph(
    [h.make_node("ReduceMean", ["image"], ["m"], axes=[2, 3], keepdims=0),
     h.make_node("MatMul", ["m", "w"], ["logits"])],
    "g", [h.make_tensor_value_info("image", T.FLOAT, ["n", 3, 224, 224])],
    [h.make_tensor_value_info("logits", T.FLOAT, ["n", 3])],
    [nh.from_array(np.eye(3, dtype="f4") * 20, "w")])
onnx.save(h.make_model(g, opset_imports=[h.make_opsetid("", 13)], ir_version=8), f"{d}/food_classifier.onnx")
json.dump({"classes": CLASSES}, open(f"{d}/classes.json", "w"))
os.environ["MODEL_DIR"] = d

from fastapi.testclient import TestClient
from PIL import Image
from app import app

c = TestClient(app)

def png(color, size=(300, 200)):
    b = io.BytesIO(); Image.new("RGB", size, color).save(b, "PNG"); return b.getvalue()

def test_predict_picks_dominant_channel():
    r = c.post("/predict", files={"file": ("x.png", png((255, 0, 0)), "image/png")}).json()
    assert r["mon"] == "a" and r["chac_chan"] and len(r["top3"]) == 3
    assert c.post("/predict", files={"file": ("x.png", png((0, 0, 255)), "image/png")}).json()["mon"] == "c"

def test_bad_file_is_400():
    assert c.post("/predict", files={"file": ("x.txt", b"hello", "text/plain")}).status_code == 400

def test_health_lists_classes():
    assert c.get("/health").json()["classes"] == CLASSES
