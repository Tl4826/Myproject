# Food100 ONNX staging artifacts

This directory contains the **100-class** model exported from Colab on 2026-11-12.

- Source: Google Drive `Myproject_food100/food_classifier.onnx`
- Size: **16,532,589 bytes**
- SHA-256: `9f6959570e714c4c5196b5988c66255248f8d40739ede7ff3be9338ee3b48c24`
- Labels: `classes.json`, exact order from `ml/train_food_100.py`
- Model: split into 15 raw binary Git blobs under `parts/` preserving every byte.

Reassemble and validate with `python ml/assemble_food100.py`. The assembled ONNX is ignored by Git. The API reconstructs a verified model into writable temporary storage when running in a read-only deployment.

Do **not** overwrite `ml/models/food_classifier.onnx` (the Food50 fallback) until testing and deployment review are complete.
