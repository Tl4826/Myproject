# Train 100 dishes for Myproject (Kaggle or Google Colab)

## Google Colab (recommended for current run)

Open [05_train_food_100_colab.ipynb](notebooks/05_train_food_100_colab.ipynb) or
[Open directly in Colab](https://colab.research.google.com/github/Tl4826/Myproject/blob/feature/food100-training/ml/notebooks/05_train_food_100_colab.ipynb).
Choose **Runtime → Change runtime type → T4 GPU** and **Runtime → Run all**.
The notebook mounts Google Drive and fetches public dataset
`quandang/vietnamese-foods` using KaggleHub; fallback options are a Drive ZIP or an
already-extracted Drive folder. Food-101 is downloaded automatically through
Torchvision. The trained checkpoints, metrics, ONNX model and final ZIP are written
to `MyDrive/Myproject_food100/`. The current production model is not changed.


**Target:** 30 Vietnamese Foods classes + 70 Food-101 classes = **100 dish labels**.
This adds **50** Food-101 classes to the previously selected 50 (20 Food-101 + 30 Vietnamese).
All original 50 label IDs have been retained in `ml/train_food_100.py`, in the same order as the
`feature/food50-onnx-integration:ml/models/classes.json` file.

## Where to train

Run [04_train_food_100.ipynb](notebooks/04_train_food_100.ipynb) on Kaggle with a **GPU**.
The notebook clones only the `feature/food100-training` branch and runs
`ml/train_food_100.py`. Nothing will overwrite Myproject's live model.

Required datasets:

1. **Vietnamese Foods**: point `--vn-root` to the folder containing
   `Train/`, `Validate/`, and `Test/` with all original 30 class folders.
   Previously used: `/kaggle/input/vietnamese-foods/Images`.
2. **Food-101**: point `--food-root` to the **parent** directory containing
   `food-101/images/` and `food-101/meta/`.
   This is around a 5 GB download if it is not already attached. Use
   `--download-food101` when Kaggle Internet is enabled.

Optional: Attach the **original 50-class PyTorch** weights (`.pt`/`.pth`) as a Kaggle
dataset and supply `--old-checkpoint` and, if needed, `--old-classes` (the exact
50-class JSON vocabulary). The 50-class ONNX file is **not** a PyTorch checkpoint.
Without that checkpoint, the script starts with ImageNet pretrained EfficientNet-B0
and trains a new 100-class classification head.

## Command

```bash
python ml/train_food_100.py \
  --vn-root /kaggle/input/vietnamese-foods/Images \
  --food-root /kaggle/working/data \
  --download-food101 \
  --out /kaggle/working/food100 \
  --epochs-head 2 --epochs-full 8 \
  --max-food-train 350 --batch-size 32
```

Omit `--download-food101` if the extracted Food-101 dataset already exists. When
continuing from a saved 50-class PyTorch checkpoint, add:

```bash
  --old-checkpoint /kaggle/input/my-food50/best.pt \
  --old-classes /kaggle/input/my-food50/classes.json
```

Adjust paths to the actual Kaggle input dataset names. The script checks that the
Vietnamese class names match the 30 previously selected ones and that every class
has training, validation, and test photos.

## Validation and artifacts

- Uses Food-101's **official test split**; validation is held out *only* from
  Food-101's training split.
- Uses Vietnamese Foods' existing `Train/Validate/Test` folder split.
- Caps Food-101 training images per class to reduce dataset imbalance.
- Selects checkpoint by **validation macro-F1** instead of overall accuracy.
- Reports metrics on held-out test images after training.
- Produces `best100.pt`, `classes.json`, `history.json`,
  `dataset_counts.json`, `test_metrics.json`, `per_class_report.json`,
  `confusion_matrix.npy`, and `food_classifier.onnx`.
- Checks that ONNX produces 100 logits and agrees numerically with PyTorch.

## Integration safety

**Do not update `ml/models/food_classifier.onnx` alone.** Deployment requires:

1. Review validation/test metrics, especially confusion among similar Vietnamese
   dishes and Food-101 categories.
2. Deploy the newly exported **ONNX model and matching `classes.json` together**.
3. Add nutrition entries for every new dish; keep unknown-dish behavior safe.
4. Test the model service `/health` and `/predict`, backend nutrition lookup,
   and frontend on a staging instance before any production rollout.
5. Keep a rollback to the current working ONNX artifact.

Note: The deployed model under `feature/web-vite` was still a 12-class model
when this training branch was created. A selected 50-class ONNX was found on a
separate `feature/food50-onnx-integration` branch, but the 50-class PyTorch
training checkpoint was **not verified** as available in GitHub.

## Sources

- Food-101: Bossard et al., ECCV 2014,
  https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/
- torchvision Food101 loader:
  https://pytorch.org/vision/main/generated/torchvision.datasets.Food101.html
- EfficientNet: Tan & Le, ICML 2019, https://arxiv.org/abs/1905.11946
