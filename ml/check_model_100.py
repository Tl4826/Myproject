"""Fail-fast validation of the Food100 ONNX and exact inference preprocessing.

Run after installing requirements.txt and assembling the model:
    python ml/check_model_100.py --image /path/to/sample.jpg

If running with shards only, this script reconstructs a checked copy in temp.
"""
import argparse
import ast
import json
import os
from pathlib import Path
import sys
import tempfile

import numpy as np
from PIL import Image, ImageOps
import onnxruntime as ort

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent))
from ml.assemble_food100 import assemble_model  # noqa: E402


def load_classes(filename):
    data = json.loads(Path(filename).read_text(encoding="utf-8"))
    if isinstance(data, list):
        labels = data
    elif isinstance(data, dict) and isinstance(data.get("classes"), list):
        labels = data["classes"]
    elif isinstance(data, dict) and all(str(k).isdigit() for k in data):
        labels = [v for _, v in sorted(data.items(), key=lambda kv: int(kv[0]))]
    elif isinstance(data, dict) and all(isinstance(v, int) for v in data.values()):
        labels = [k for k, _ in sorted(data.items(), key=lambda kv: kv[1])]
    else:
        raise ValueError("Unsupported classes.json format")
    if not isinstance(labels, list) or not all(isinstance(x, str) and x for x in labels):
        raise ValueError("Invalid class labels")
    if len(labels) != len(set(labels)):
        raise ValueError("Duplicate labels")
    return labels


def preprocess(image):
    with Image.open(image) as im:
        rgb = ImageOps.exif_transpose(im).convert("RGB")
    # EXACT torchvision eval transform: Resize(256), CenterCrop(224).
    w, h = rgb.size
    if w <= h:
        nw, nh = 256, int(256 * h / w)
    else:
        nw, nh = int(256 * w / h), 256
    resized = rgb.resize((nw, nh), Image.Resampling.BILINEAR)
    left, top = (nw - 224) // 2, (nh - 224) // 2
    crop = resized.crop((left, top, left + 224, top + 224))
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    x = np.asarray(crop, dtype=np.float32) / 255.0
    return ((x - mean) / std).transpose(2, 0, 1)[None].astype(np.float32)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", type=Path, default=ROOT / "models_food100")
    parser.add_argument("--image", type=Path, help="Optional image to print Top 3 predictions")
    args = parser.parse_args()

    labels = load_classes(args.model_dir / "classes.json")
    if len(labels) != 100:
        raise AssertionError(f"Expected 100 classes, got {len(labels)}")
    # Match the exact training class IDs, not merely the output dimension.
    source = ast.parse((ROOT / "train_food_100.py").read_text(encoding="utf-8"))
    expected_groups = ("BASE_FOOD_20", "BASE_VIETNAMESE_30", "ADDITIONAL_FOOD_50")
    groups = {}
    for statement in source.body:
        if isinstance(statement, ast.Assign):
            for target in statement.targets:
                if isinstance(target, ast.Name) and target.id in expected_groups:
                    groups[target.id] = ast.literal_eval(statement.value)
    if any(group not in groups for group in expected_groups):
        raise AssertionError("Training source does not define all three class groups")
    expected_labels = [name for group in expected_groups for name in groups[group]]
    if labels != expected_labels:
        first_mismatch = next(
            (i for i, (actual, expected) in enumerate(zip(labels, expected_labels))
             if actual != expected),
            min(len(labels), len(expected_labels)),
        )
        raise AssertionError(
            f"Label order differs from training at index {first_mismatch}: "
            f"model_labels={labels[first_mismatch:first_mismatch+1]}, "
            f"training_labels={expected_labels[first_mismatch:first_mismatch+1]}"
        )
    with tempfile.TemporaryDirectory(prefix="nutrivn-food100-check-") as directory:
        model_path = assemble_model(args.model_dir, Path(directory) / "food_classifier.onnx")
        session = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
        inp, out = session.get_inputs()[0], session.get_outputs()[0]
        if isinstance(out.shape[-1], int) and out.shape[-1] != len(labels):
            raise AssertionError(f"Model output has {out.shape[-1]} vs {len(labels)} classes")
        print("Verified model:", model_path.stat().st_size, "bytes")
        print("Input:", inp.name, inp.shape, inp.type, "Output:", out.shape)
        if args.image:
            logits = np.asarray(session.run(None, {inp.name: preprocess(args.image)})[0]).reshape(-1)
            if len(logits) != 100 or not np.isfinite(logits).all():
                raise AssertionError("Invalid ONNX inference output")
            probs = np.exp(logits - logits.max())
            probs /= probs.sum()
            for i in np.argsort(probs)[-3:][::-1]:
                print(f"{labels[i]:30s} {probs[i]:.3f}")


if __name__ == "__main__":
    main()
