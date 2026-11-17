"""Rebuild the exact Colab Food100 ONNX artifact from Git binary shards.

Usage:
    python ml/assemble_food100.py
    python ml/assemble_food100.py --out /tmp/food_classifier.onnx

No network is required. A SHA-256 mismatch aborts before inference.
"""
import argparse
import hashlib
import os
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parent
DEFAULT_MODEL_DIR = ROOT / "models_food100"
EXPECTED_BYTES = 16532589
EXPECTED_PARTS = 15


def assemble_model(model_dir=DEFAULT_MODEL_DIR, output=None):
    model_dir = Path(model_dir)
    digest_path = model_dir / "model.sha256"
    expected = digest_path.read_text(encoding="ascii").strip().split()[0]
    if len(expected) != 64 or any(c not in "0123456789abcdef" for c in expected):
        raise ValueError("Invalid SHA-256 digest in model.sha256")

    parts_dir = model_dir / "parts"
    parts = sorted(parts_dir.glob("*.bin"))
    expected_names = [f"{i:03}.bin" for i in range(EXPECTED_PARTS)]
    if [part.name for part in parts] != expected_names:
        raise ValueError("Missing or out-of-order model shards in " + str(parts_dir))

    target = Path(output) if output is not None else model_dir / "food_classifier.onnx"
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_file() and target.stat().st_size == EXPECTED_BYTES:
        if digest_file(target) == expected:
            return target

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb", dir=target.parent, prefix=".assembling-food100-", delete=False
        ) as output_file:
            tmp_path = Path(output_file.name)
            sha = hashlib.sha256()
            size = 0
            for part in parts:
                with part.open("rb") as source:
                    while chunk := source.read(1024 * 1024):
                        output_file.write(chunk)
                        sha.update(chunk)
                        size += len(chunk)
        if size != EXPECTED_BYTES or sha.hexdigest() != expected:
            raise ValueError(
                f"Food100 ONNX verification failed: bytes={size}, sha256={sha.hexdigest()}"
            )
        os.replace(tmp_path, target)
        return target
    finally:
        if tmp_path is not None and tmp_path.exists():
            tmp_path.unlink()


def digest_file(path):
    sha = hashlib.sha256()
    with Path(path).open("rb") as source:
        while block := source.read(1024 * 1024):
            sha.update(block)
    return sha.hexdigest()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", type=Path, default=DEFAULT_MODEL_DIR)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()
    result = assemble_model(args.model_dir, args.out)
    print("Verified:", result, result.stat().st_size, "bytes", digest_file(result))
