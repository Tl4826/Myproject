"""Evaluate the actual Food50 ONNX model on independently labeled photos.

Dataset layout:
  photos/
    Banh cuon/001.jpg
    Hu tieu/001.jpg
    Pho/001.jpg
Folder names MUST exactly match ml/models/classes.json.
Run from repository root:
  python ml/evaluate_real_photos.py --photos path/to/photos --out evaluation-results
Photos are processed locally and are never uploaded or copied into the report.
"""
import argparse
import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "models"
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def preprocess(path):
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        image = image.resize((224, 224), Image.Resampling.BILINEAR)
        pixels = np.asarray(image, dtype=np.float32) / 255.0
    return ((pixels - MEAN) / STD).transpose(2, 0, 1)[None]


def evaluate(photos, out, model_dir):
    labels_data = json.loads((model_dir / "classes.json").read_text(encoding="utf-8"))
    classes = labels_data["classes"] if isinstance(labels_data, dict) else labels_data
    if len(classes) != 50 or len(set(classes)) != 50:
        raise ValueError("Expected 50 unique Food50 class labels")
    if not photos.is_dir():
        raise ValueError(f"Photo folder does not exist: {photos}")
    unknown = sorted(p.name for p in photos.iterdir() if p.is_dir() and p.name not in classes)
    if unknown:
        raise ValueError("Unknown class folders (names must match classes.json): " + ", ".join(unknown))
    items = sorted((path, label) for label in classes for path in (photos / label).rglob("*")
                   if path.is_file() and path.suffix.lower() in EXTENSIONS)
    if not items:
        raise ValueError("No labeled images found. Use photos/<exact class label>/image.jpg")

    session = ort.InferenceSession(str(model_dir / "food_classifier.onnx"), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name
    rows, failures = [], []
    for path, actual in items:
        try:
            logits = np.asarray(session.run(None, {input_name: preprocess(path)})[0]).reshape(-1)
            if logits.size != len(classes) or not np.all(np.isfinite(logits)):
                raise ValueError("Unexpected or non-finite model output")
            probabilities = np.exp(logits - logits.max())
            probabilities /= probabilities.sum()
            indices = np.argsort(probabilities)[::-1][:3]
            predicted = classes[int(indices[0])]
            rows.append({
                "image": str(path.relative_to(photos)),
                "actual": actual,
                "predicted": predicted,
                "confidence": round(float(probabilities[indices[0]]), 5),
                "top1_correct": int(predicted == actual),
                "top3_correct": int(actual in [classes[int(i)] for i in indices]),
                "top3": " | ".join(f"{classes[int(i)]}: {probabilities[i]:.3f}" for i in indices),
            })
        except (OSError, ValueError, UnidentifiedImageError) as exc:
            failures.append({"image": str(path.relative_to(photos)), "error": str(exc)})

    if not rows:
        raise ValueError("No images could be evaluated")
    out.mkdir(parents=True, exist_ok=True)
    with (out / "predictions.csv").open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    per_class = defaultdict(list)
    confusion = Counter()
    for row in rows:
        per_class[row["actual"]].append(row)
        if not row["top1_correct"]:
            confusion[(row["actual"], row["predicted"])] += 1
    class_results = [
        {"class": label, "images": len(per_class[label]),
         "top1_accuracy": round(sum(x["top1_correct"] for x in per_class[label]) / len(per_class[label]), 4),
         "top3_accuracy": round(sum(x["top3_correct"] for x in per_class[label]) / len(per_class[label]), 4)}
        for label in classes if per_class[label]
    ]
    summary = {
        "images_evaluated": len(rows),
        "images_skipped": len(failures),
        "classes_evaluated": len(class_results),
        "top1_accuracy": round(sum(r["top1_correct"] for r in rows) / len(rows), 4),
        "top3_accuracy": round(sum(r["top3_correct"] for r in rows) / len(rows), 4),
        "per_class": class_results,
        "most_confused_pairs": [
            {"actual": actual, "predicted": predicted, "count": count}
            for (actual, predicted), count in confusion.most_common(20)
        ],
        "skipped_files": failures,
        "note": "Results apply only to supplied labeled photos; they are not training/test dataset accuracy.",
    }
    (out / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Evaluated {len(rows)} photos across {len(class_results)}/50 classes; skipped {len(failures)}")
    print(f"Top-1 accuracy: {summary['top1_accuracy']:.1%}; Top-3 accuracy: {summary['top3_accuracy']:.1%}")
    print(f"Reports: {out / 'summary.json'} and {out / 'predictions.csv'}")
    if len(class_results) < 50:
        print("Warning: not all 50 classes are represented; results are not a full Food50 evaluation.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--photos", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path("evaluation-results"))
    parser.add_argument("--model-dir", type=Path, default=MODEL_DIR)
    args = parser.parse_args()
    try:
        evaluate(args.photos, args.out, args.model_dir)
    except (OSError, ValueError, ort.OnnxRuntimeError) as exc:
        print(f"Evaluation failed: {exc}", file=sys.stderr)
        sys.exit(1)
