"""Train Myproject's 100-dish EfficientNet-B0 (50 existing + 50 Food-101 classes).

Source datasets:
  * Food-101 from ETH Zurich (official train/test split)
  * Vietnamese Foods (30 classes, pre-split Train/Validate/Test)

This script does not change the deployed 12-class ONNX model.
Usage: python ml/train_food_100.py --vn-root /kaggle/input/vietnamese-foods/Images \
    --food-root /kaggle/working/data --download-food101 --out /kaggle/working/food100

To preserve existing 50-class weights, additionally pass --old-checkpoint and
--old-classes. Never try to warm start from the deployed 12-class checkpoint.
"""
import argparse
import json
import random
import time
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageOps
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import datasets, models, transforms

BASE_FOOD_20 = [
    "pizza",
    "hamburger",
    "sushi",
    "ramen",
    "fried_rice",
    "french_fries",
    "caesar_salad",
    "omelette",
    "grilled_cheese_sandwich",
    "steak",
    "spaghetti_bolognese",
    "lasagna",
    "pancakes",
    "waffles",
    "donuts",
    "ice_cream",
    "chicken_wings",
    "french_onion_soup",
    "grilled_salmon",
    "greek_salad"
]
BASE_VIETNAMESE_30 = [
    "Banh beo",
    "Banh bot loc",
    "Banh can",
    "Banh canh",
    "Banh chung",
    "Banh cuon",
    "Banh duc",
    "Banh gio",
    "Banh khot",
    "Banh mi",
    "Banh pia",
    "Banh tet",
    "Banh trang nuong",
    "Banh xeo",
    "Bun bo Hue",
    "Bun dau mam tom",
    "Bun mam",
    "Bun rieu",
    "Bun thit nuong",
    "Ca kho to",
    "Canh chua",
    "Cao lau",
    "Chao long",
    "Com tam",
    "Goi cuon",
    "Hu tieu",
    "Mi quang",
    "Nem chua",
    "Pho",
    "Xoi xeo"
]
ADDITIONAL_FOOD_50 = [
    "apple_pie",
    "baby_back_ribs",
    "baklava",
    "beef_carpaccio",
    "beef_tartare",
    "bibimbap",
    "breakfast_burrito",
    "bruschetta",
    "cannoli",
    "caprese_salad",
    "carrot_cake",
    "cheesecake",
    "chicken_curry",
    "chicken_quesadilla",
    "chocolate_cake",
    "chocolate_mousse",
    "churros",
    "clam_chowder",
    "club_sandwich",
    "crab_cakes",
    "creme_brulee",
    "croque_madame",
    "cup_cakes",
    "dumplings",
    "edamame",
    "eggs_benedict",
    "falafel",
    "fish_and_chips",
    "french_toast",
    "frozen_yogurt",
    "garlic_bread",
    "gnocchi",
    "gyoza",
    "hot_and_sour_soup",
    "hot_dog",
    "hummus",
    "lobster_roll_sandwich",
    "macaroni_and_cheese",
    "macarons",
    "miso_soup",
    "nachos",
    "onion_rings",
    "pad_thai",
    "paella",
    "peking_duck",
    "poutine",
    "ravioli",
    "tacos",
    "takoyaki",
    "tiramisu"
]
CLASSES = BASE_FOOD_20 + BASE_VIETNAMESE_30 + ADDITIONAL_FOOD_50

assert len(CLASSES) == len(set(CLASSES)) == 100
assert len(BASE_FOOD_20 + BASE_VIETNAMESE_30) == 50
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


class Images(Dataset):
    def __init__(self, items, transform):
        self.items = items
        self.transform = transform

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        filename, label = self.items[idx]
        with Image.open(filename) as im:
            img = ImageOps.exif_transpose(im).convert("RGB")
        return self.transform(img), label


def get_vietnamese(vn_root, class_index):
    if not vn_root.exists():
        raise FileNotFoundError(
            f"Vietnamese dataset missing: {vn_root}. Add the dataset on Kaggle "
            "or set --vn-root to the Images folder."
        )
    actual = sorted(p.name for p in (vn_root / "Train").iterdir() if p.is_dir())
    if actual != sorted(BASE_VIETNAMESE_30):
        raise ValueError(
            "Vietnamese class folders do not match the original 30-class vocabulary.\n"
            f"Missing: {sorted(set(BASE_VIETNAMESE_30) - set(actual))}\n"
            f"Unexpected: {sorted(set(actual) - set(BASE_VIETNAMESE_30))}"
        )

    splits = {"Train": [], "Validate": [], "Test": []}
    for split in splits:
        for name in BASE_VIETNAMESE_30:
            directory = vn_root / split / name
            if not directory.is_dir():
                raise FileNotFoundError(f"Missing class folder: {directory}")
            paths = sorted(
                p for p in directory.rglob("*")
                if p.is_file() and p.suffix.lower() in IMAGE_EXTS
            )
            if not paths:
                raise ValueError(f"No {split} photos for {name}: {directory}")
            splits[split].extend((str(p), class_index[name]) for p in paths)
    return splits


def get_food101(food_root, download, class_index, seed, max_food_train):
    try:
        food_train = datasets.Food101(root=food_root, split="train", download=download)
        food_test = datasets.Food101(root=food_root, split="test", download=download)
    except (RuntimeError, FileNotFoundError) as exc:
        raise RuntimeError(
            f"Food-101 not available under {food_root}. Attach a Food-101 Kaggle "
            "dataset and point --food-root to its parent folder (containing "
            "'food-101/'), or enable Kaggle internet and pass --download-food101."
        ) from exc

    selected = BASE_FOOD_20 + ADDITIONAL_FOOD_50
    missing = set(selected) - set(food_train.classes)
    if missing:
        raise ValueError(f"Food-101 classes not found: {sorted(missing)}")

    grouped = defaultdict(list)
    for path, y in zip(food_train._image_files, food_train._labels):
        name = food_train.classes[y]
        if name in selected:
            grouped[name].append(str(path))

    rng = random.Random(seed)
    train, val, test = [], [], []
    for name in selected:
        paths = grouped[name]
        rng.shuffle(paths)
        n_val = max(1, round(len(paths) * 0.10))
        validation = paths[:n_val]
        training = paths[n_val:n_val + max_food_train]
        if len(training) < 20:
            raise ValueError(f"Too few Food-101 training photos for {name}")
        train.extend((p, class_index[name]) for p in training)
        val.extend((p, class_index[name]) for p in validation)

    for path, y in zip(food_test._image_files, food_test._labels):
        name = food_test.classes[y]
        if name in selected:
            test.append((str(path), class_index[name]))
    return {"Train": train, "Validate": val, "Test": test}


def prepare(args):
    idx = {name: i for i, name in enumerate(CLASSES)}
    food = get_food101(args.food_root, args.download_food101, idx, args.seed,
                       args.max_food_train)
    vn = get_vietnamese(args.vn_root, idx)
    items = {
        split: food[split] + vn[split] for split in ("Train", "Validate", "Test")
    }

    # Detect path leakage. Food-101 has distinct official train/test paths;
    # Vietnamese Foods already provides pre-separated folders.
    paths = [{p for p, _ in items[s]} for s in items]
    if any(paths[i] & paths[j] for i in range(3) for j in range(i + 1, 3)):
        raise RuntimeError("Image path appears in more than one dataset split.")

    random.Random(args.seed).shuffle(items["Train"])
    for split in items:
        counts = Counter(y for _, y in items[split])
        missing = [c for c, i in idx.items() if counts[i] == 0]
        if missing:
            raise ValueError(f"Split {split} missing classes: {missing}")
        print(f"{split}: {len(items[split])} images, {len(counts)} classes; "
              f"min/class={min(counts.values())}, max/class={max(counts.values())}")

    norm = transforms.Normalize([0.485, 0.456, 0.406],
                                [0.229, 0.224, 0.225])
    tf_train = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.70, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.12, contrast=0.12),
        transforms.ToTensor(), norm,
    ])
    tf_eval = transforms.Compose([
        transforms.Resize(256), transforms.CenterCrop(224),
        transforms.ToTensor(), norm,
    ])
    loader = {
        s: DataLoader(Images(items[s], tf_train if s == "Train" else tf_eval),
                      batch_size=args.batch_size, shuffle=s == "Train",
                      num_workers=args.workers,
                      pin_memory=torch.cuda.is_available())
        for s in items
    }

    counts = np.bincount([y for _, y in items["Train"]], minlength=100)
    weights = np.sqrt(counts.sum() / (100 * np.maximum(counts, 1)))
    # Keep weights from becoming extreme with very small data classes.
    weights = np.clip(weights, 0.5, 3.0).astype(np.float32)
    return loader, torch.from_numpy(weights), items


def load_old_classes(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    return data["classes"] if isinstance(data, dict) else data


def model_for_training(old_checkpoint=None, old_classes=None):
    model = models.efficientnet_b0(
        weights=models.EfficientNet_B0_Weights.DEFAULT
    )
    features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(features, 100)

    if old_checkpoint is not None:
        raw = torch.load(old_checkpoint, map_location="cpu", weights_only=True)
        state = raw.get("state_dict", raw.get("model_state_dict", raw))
        state = {k.removeprefix("module."): v for k, v in state.items()}
        old_labels = old_classes or raw.get("classes")
        if old_labels is None:
            raise ValueError("Old checkpoint needs its 50-label --old-classes JSON")
        if (len(old_labels) != 50 or len(set(old_labels)) != 50
                or set(old_labels) != set(CLASSES[:50])):
            raise ValueError("50-label mapping differs from the original vocabulary.")
        old_w = state.pop("classifier.1.weight")
        old_b = state.pop("classifier.1.bias")
        if old_w.shape != (50, features) or old_b.shape != (50,):
            raise ValueError("Old checkpoint is not an EfficientNet-B0 50-class head")
        status = model.load_state_dict(state, strict=False)
        if set(status.missing_keys) != {"classifier.1.weight", "classifier.1.bias"}:
            raise ValueError(f"Unexpected checkpoint mismatch: {status}")
        if status.unexpected_keys:
            raise ValueError(f"Unexpected checkpoint keys: {status.unexpected_keys}")
        with torch.no_grad():
            for old_idx, label in enumerate(old_labels):
                new_idx = CLASSES.index(label)
                model.classifier[1].weight[new_idx].copy_(old_w[old_idx])
                model.classifier[1].bias[new_idx].copy_(old_b[old_idx])
        print("Loaded 50-class weights; all 50 original class rows preserved.")
    else:
        print("No old 50-class checkpoint: training from ImageNet pretrained weights.")
    return model


def evaluate(model, loader, device, loss_fn):
    model.eval()
    actual, predicted = [], []
    total_loss = 0.0
    with torch.inference_mode():
        for x, y in loader:
            x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
            logits = model(x)
            total_loss += loss_fn(logits, y).item() * len(y)
            actual.extend(y.cpu().tolist())
            predicted.extend(logits.argmax(1).cpu().tolist())
    f1 = f1_score(actual, predicted, average="macro", labels=list(range(100)),
                  zero_division=0)
    return {
        "loss": total_loss / max(len(actual), 1),
        "accuracy": accuracy_score(actual, predicted),
        "macro_f1": f1,
        "y_true": actual,
        "y_pred": predicted,
    }


def run_train_epoch(model, loader, optimizer, loss_fn, device, scaler):
    model.train()
    total_loss = 0.0
    total_correct = 0
    total_seen = 0
    for x, y in loader:
        x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
        optimizer.zero_grad(set_to_none=True)
        with torch.autocast(device_type="cuda", enabled=(device.type == "cuda")):
            logits = model(x)
            loss = loss_fn(logits, y)
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
        total_loss += loss.item() * len(y)
        total_correct += (logits.argmax(1) == y).sum().item()
        total_seen += len(y)
    return total_loss / total_seen, total_correct / total_seen


def train(model, loader, loss_fn, device, args, out):
    model.to(device)
    scaler = torch.amp.GradScaler("cuda", enabled=device.type == "cuda")
    best = -1.0
    best_epoch = None
    epoch_number = 0
    history = []

    for phase, epochs, lr in [
        ("head", args.epochs_head, args.lr_head),
        ("full", args.epochs_full, args.lr_full),
    ]:
        for p in model.features.parameters():
            p.requires_grad = phase == "full"
        optimizer = torch.optim.AdamW(
            (p for p in model.parameters() if p.requires_grad),
            lr=lr, weight_decay=1e-4,
        )
        no_improve = 0
        for local_epoch in range(epochs):
            epoch_number += 1
            start = time.time()
            loss, acc = run_train_epoch(model, loader["Train"], optimizer,
                                        loss_fn, device, scaler)
            val = evaluate(model, loader["Validate"], device, loss_fn)
            record = {
                "phase": phase, "epoch": epoch_number, "train_loss": loss,
                "train_accuracy": acc, "val_loss": val["loss"],
                "val_accuracy": val["accuracy"], "val_macro_f1": val["macro_f1"],
                "seconds": round(time.time() - start, 1),
            }
            history.append(record)
            print(json.dumps(record, ensure_ascii=False))
            if val["macro_f1"] > best + 1e-5:
                best, best_epoch, no_improve = val["macro_f1"], epoch_number, 0
                torch.save({
                    "state_dict": model.state_dict(), "classes": CLASSES,
                    "best_val_macro_f1": best, "epoch": best_epoch,
                }, out / "best100.pt")
            else:
                no_improve += 1
            (out / "history.json").write_text(
                json.dumps(history, indent=2), encoding="utf-8"
            )
            if phase == "full" and no_improve >= args.patience:
                print(f"Early stopping after {args.patience} non-improving epochs.")
                break

    if best_epoch is None:
        raise RuntimeError("No epoch was trained. Increase --epochs-head or --epochs-full.")
    checkpoint = torch.load(out / "best100.pt", map_location="cpu", weights_only=True)
    model.load_state_dict(checkpoint["state_dict"])
    model.to(device)
    return best, best_epoch


def export_onnx(model, out):
    import onnx
    import onnxruntime as ort

    model = model.cpu().eval()
    dummy = torch.randn(1, 3, 224, 224)
    model_path = out / "food_classifier.onnx"
    with torch.inference_mode():
        expected = model(dummy).numpy()

    # Legacy exporter is less fragile across Kaggle/Colab torch versions.
    torch.onnx.export(model, dummy, str(model_path),
                      input_names=["image"], output_names=["logits"],
                      opset_version=17, dynamo=False)
    onnx_model = onnx.load(str(model_path))
    onnx.save(onnx_model, str(model_path), save_as_external_data=False)
    (out / "food_classifier.onnx.data").unlink(missing_ok=True)

    session = ort.InferenceSession(
        str(model_path), providers=["CPUExecutionProvider"]
    )
    output = session.run(None, {"image": dummy.numpy()})[0]
    if output.shape != (1, 100) or not np.allclose(
            output, expected, rtol=1e-3, atol=2e-3):
        raise RuntimeError("ONNX and PyTorch inference mismatch.")
    print(f"ONNX validated: {model_path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vn-root", type=Path,
                        default=Path("/kaggle/input/vietnamese-foods/Images"))
    parser.add_argument("--food-root", type=Path,
                        default=Path("/kaggle/working/data"))
    parser.add_argument("--download-food101", action="store_true")
    parser.add_argument("--out", type=Path,
                        default=Path("/kaggle/working/food100"))
    parser.add_argument("--old-checkpoint", type=Path)
    parser.add_argument("--old-classes", type=Path)
    parser.add_argument("--max-food-train", type=int, default=350)
    parser.add_argument("--epochs-head", type=int, default=2)
    parser.add_argument("--epochs-full", type=int, default=8)
    parser.add_argument("--lr-head", type=float, default=1e-3)
    parser.add_argument("--lr-full", type=float, default=1e-4)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--patience", type=int, default=3)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--skip-onnx", action="store_true")
    args = parser.parse_args()
    if args.old_classes and not args.old_checkpoint:
        parser.error("--old-classes requires --old-checkpoint")
    if args.epochs_head + args.epochs_full < 1:
        parser.error("At least one training epoch is required")
    if args.max_food_train < 20 or args.batch_size < 1:
        parser.error("Invalid --max-food-train or --batch-size")

    args.out.mkdir(parents=True, exist_ok=True)
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(args.seed)
        torch.backends.cudnn.benchmark = True
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device={device}, classes={len(CLASSES)}, output={args.out}")

    loader, weights, items = prepare(args)
    (args.out / "classes.json").write_text(
        json.dumps({"classes": CLASSES}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    (args.out / "dataset_counts.json").write_text(
        json.dumps({
            split: dict(sorted(Counter(CLASSES[y] for _, y in records).items()))
            for split, records in items.items()
        }, indent=2, ensure_ascii=False), encoding="utf-8",
    )
    labels = load_old_classes(args.old_classes) if args.old_classes else None
    model = model_for_training(args.old_checkpoint, labels)
    loss_fn = nn.CrossEntropyLoss(weight=weights.to(device), label_smoothing=0.05)
    best, epoch = train(model, loader, loss_fn, device, args, args.out)

    test = evaluate(model, loader["Test"], device, loss_fn)
    summary = {
        "classes": 100, "best_epoch": epoch, "best_val_macro_f1": best,
        "test_accuracy": test["accuracy"], "test_macro_f1": test["macro_f1"],
        "test_images": len(test["y_true"]),
    }
    (args.out / "test_metrics.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )
    report = classification_report(
        test["y_true"], test["y_pred"], labels=list(range(100)),
        target_names=CLASSES, output_dict=True, zero_division=0,
    )
    (args.out / "per_class_report.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    np.save(args.out / "confusion_matrix.npy",
            confusion_matrix(test["y_true"], test["y_pred"],
                             labels=list(range(100))))
    print("TEST (previously unseen images):", json.dumps(summary))
    if not args.skip_onnx:
        export_onnx(model, args.out)
    print("Training complete. Review metrics before updating deployment.")


if __name__ == "__main__":
    main()
