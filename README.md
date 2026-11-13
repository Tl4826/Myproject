# Food Nutrition AI — NutriVN

> VNUK course project: image-based food recognition, a nutrition-estimate interface, a daily meal diary, and an experimental AI model service.

## Submission snapshot (13 November 2026)

- **Repository:** https://github.com/Tl4826/Myproject
- **Default / grading branch:** `feature/web-vite` (not `main` or `master`). GitHub's default-branch clone checks out this branch.
- **AI:** a **100-class ONNX food classifier** (30 Vietnamese classes + 70 Food-101 classes), integrated via FastAPI, with a 50-class rollback option.
- **Web:** React + Vite, camera capture and image upload, top-3 prediction review, diary, reports and onboarding UI.
- **Important distinction:** The API is an interface *to our trained model*, not a paid third-party food-recognition API.
- **Current limitations:** Many of the 100 labels do not yet have nutrition estimates; web login is a browser-only prototype rather than verified server authentication; diary/profile persistence is browser-local (not MySQL in this branch). See below.

## Run the project locally

Prerequisites: Python 3.11, Node.js 20+, and enough disk space for ONNX Runtime and the ONNX files. Run commands from the **repository root** unless stated otherwise.

### 1. AI inference API

NaNbash
python -m venv .venv
# Activate the environment: Windows: .venv\Scripts\activate | macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python ml/assemble_food100.py
python -m uvicorn ml.service.app:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000/health for the list of model classes, or http://127.0.0.1:8000/docs for the FastAPI interactive documentation. The photo classifier is `POST /predict` with multipart field `file`. It returns the predicted dish, confidence, top three possibilities and uncertainty flags. A classification does **not** measure the photo's portion size.

On first startup the API can reconstruct the 100-class model from checksum-verified shards under `ml/models_food100/parts/`. The original 50-class model remains in `ml/models/`. To use that fallback, set `FOOD_MODEL_VARIANT=50` **before** starting the API.

### 2. React frontend

Open another terminal:

NaNbash
cd web
npm ci
# Copy .env.example to .env.development.local and set VITE_API_URL=http://localhost:8000
npm run dev
```

Open the URL reported by Vite (normally http://localhost:5173). Camera access works on localhost or secure HTTPS pages, subject to browser permission. The app will call the local FastAPI service if `VITE_API_URL` points to it.

**Demo login caveat:** The current browser-only sign-in form does not authenticate credentials against a backend and must not be presented as a secure account system. Data stored in localStorage/sessionStorage is per browser/device. Do not enter a real password into the demo.

### 3. Tests / grading checks

NaNbash
python ml/assemble_food100.py
python ml/check_model_100.py
python -m unittest discover -s ml/service -p 'test_food100_api.py' -v
npm --prefix web ci
npm --prefix web run build
```

These are test commands, not a claim that they have been executed successfully in this update. A teacher should run the local tests and verify a real-food photo end-to-end. Blank/non-food images are not meaningful evidence of recognition accuracy.

## Project architecture

NaNtext
Browser (React / Vite)
    |  image upload or camera photo
    v
FastAPI /predict (ml/service/app.py)
    |  ONNX Runtime inference
    v
100-class food model -> predicted label + top-3 + confidence
    |
    v
Frontend nutrition lookup (web/src/lib/data.js; limited estimates)
    |
    v
Browser-local diary and report
```

- `web/` — React/Vite source, camera, diary, reports, onboarding UI.
- `api/index.py` — Vercel entry point wrapping the same FastAPI service.
- `ml/service/` — image preprocessing, ONNX inference, API route, and API tests.
- `ml/models_food100/` — ONNX model shards, labels, checksum and rebuild instructions.
- `ml/models/` — retained 50-class model fallback.
- `ml/notebooks/`, `ml/train_food_100.py` — model training code and notebooks.
- `docs/VERCEL.md` — Vercel configuration and deployment checks.

## Deployment

The repo includes `vercel.json` to build `web/` and deploy the Python API under `/api/*`, including `GET /api/health` and `POST /api/predict`. The browser build uses `VITE_API_URL=/api` in `web/.env.production`. **A GitHub push alone does not prove deployment works**; check the actual hosted `/api/health`, a real image scan, and Vercel function logs. Resource limits/cold starts can affect ONNX inference. Full deployment details: [docs/VERCEL.md](docs/VERCEL.md).

## What is and is not integrated yet

| Component | Current state on `feature/web-vite` |
|---|---|
| 100-dish ONNX model | Files checked in as verified shards; service code selects Food100 by default |
| Image recognition API | FastAPI `/predict` exists; end-to-end production success still needs testing |
| Camera and photo upload | Present in frontend |
| Nutrition and protein estimates | Local lookup; currently available for only a subset of labels, **not** all 100 |
| Login / registration | Browser-only prototype; no server credential verification |
| Meal diary / reports | Browser localStorage; not synchronized between devices |
| Node/MySQL backend | Team implementation exists on separate `feature/tuananh-backend` branch; **not merged into this grading branch** |

Do not state that the active branch has secure authentication, a connected MySQL database, or complete nutrition data for 100 dishes until those features are integrated and tested. The Node backend should be reviewed and integrated in a separate PR, not copied over the working Vercel/FastAPI setup without validation.

## AI training and evaluation

- Food100 training instructions and dataset sources: [ml/TRAIN_100.md](ml/TRAIN_100.md).
- Exported model information and exact checksum: [ml/models_food100/README.md](ml/models_food100/README.md).
- Real-world photo evaluation procedure: [ml/REAL_PHOTO_EVALUATION.md](ml/REAL_PHOTO_EVALUATION.md).
- The training workflow reported a held-out test accuracy around **83.83%** (22,540 test images; macro-F1 around **0.839**). This comes from the recorded Colab run, **not a new verification performed by this README update**. Include the original saved metrics/artifacts when presenting it as an assessed result.
- Accuracy on held-out dataset images does not guarantee accuracy on new phone photos; ask users to confirm uncertain predictions.

## Team responsibilities (original plan)

| Member | Responsibility |
|---|---|
| Thanh | Food classification model, model service, inference/deployment |
| Huy | Frontend, UI/UX and nutrition lookup |
| Tuấn Anh | Node backend and database work (separate branch) |
| Hồng | Reporting, wireframes, planning, issues, self-reports |

## Caveats and academic integrity

Nutrition values are approximations per standard serving; a single image cannot provide reliably measured calories, portion weight or protein. Predictions can be wrong or uncertain. Do not use the prototype for medical advice. Cite all datasets, code and papers in the final report; see Food-101 and EfficientNet references in [ml/TRAIN_100.md](ml/TRAIN_100.md).

No passwords, personal photos, API keys, database URLs or `.env` secrets should be committed to this public repository.
