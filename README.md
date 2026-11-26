# Food Nutrition AI — NutriVN

> VNUK course project: image-based food recognition, a nutrition-estimate interface, a daily meal diary, and an experimental AI model service.

## Submission snapshot (26 November 2026)

- **Repository:** https://github.com/Tl4826/Myproject
- **This README describes:** `main`, the production deployment branch. GitHub's default branch remains `feature/web-vite` at the time of this update; it has diverged from `main`. Confirm the grading branch with the team and lecturer before submission. Do not overwrite either branch to resolve this.
- **Production:** https://nutrivn-main.vercel.app
- **AI:** 100-class ONNX classifier (30 Vietnamese + 70 Food-101 classes), served by FastAPI, with a 50-class fallback.
- **Web:** Next.js 14 App Router, React 18, Tailwind CSS; camera/upload, top-3 prediction review, diary, reports, About and Contact.
- **Backend:** Vercel Node endpoints for email/social authentication and account-scoped diary; Neon PostgreSQL schema in `database/schema.sql`. Email credentials are checked server-side. Social-account diary operations use the server API; email-account diary and some profile/report data still use browser storage.
- **Limitations:** Nutrition estimates cover only a subset of labels. Production health and route checks are not equivalent to real-image inference, authentication or cross-device diary verification.

## Run the project locally

Prerequisites: Python 3.11, Node.js 20+, and enough disk space for ONNX Runtime and the ONNX files. Run commands from the **repository root** unless stated otherwise.

### 1. AI inference API

```bash
python -m venv .venv
# Activate the environment: Windows: .venv\Scripts\activate | macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python ml/assemble_food100.py
python -m uvicorn ml.service.app:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000/health for the list of model classes, or http://127.0.0.1:8000/docs for the FastAPI interactive documentation. The photo classifier is `POST /predict` with multipart field `file`. It returns the predicted dish, confidence, top three possibilities and uncertainty flags. A classification does **not** measure the photo's portion size.

On first startup the API can reconstruct the 100-class model from checksum-verified shards under `ml/models_food100/parts/`. The original 50-class model remains in `ml/models/`. To use that fallback, set `FOOD_MODEL_VARIANT=50` **before** starting the API.

### 2. Next.js frontend

```bash
cd web
npm ci
# Copy .env.example to .env.development.local and set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open the URL printed by Next.js (normally http://localhost:3000). Start the real FastAPI service separately for AI inference. The optional `npm run dev:local` uses a local mock API for development and synthetic UI testing; it does not verify real credentials or production PostgreSQL.

For a full backend deployment, configure the team-owned Neon database and authentication settings in Vercel, apply the schema through the team's database process, and keep secrets out of Git. Do not use real personal data for grading tests.

### 3. Tests / grading checks

```bash
python ml/assemble_food100.py
python ml/check_model_100.py
python -m unittest discover -s ml/service -p 'test_food100_api.py' -v
npm --prefix web ci
npm --prefix web run build
```

These are test commands, not a claim that they have been executed successfully in this update. A teacher should run the local tests and verify a real-food photo end-to-end. Blank/non-food images are not meaningful evidence of recognition accuracy.

## Project architecture

```text
Browser (Next.js 14 / React)
  | photo upload -> /api/predict -> FastAPI -> ONNX Runtime
  | email/social auth -> Node API -> Neon PostgreSQL
  | social-account diary -> /api/diary -> account-scoped PostgreSQL
  | email-account diary and some profile/report data -> browser storage
  + nutrition lookup, diary and reports
```

- `web/` — Next.js App Router frontend.
- `api/index.py`, `ml/service/` — Vercel FastAPI entry point and inference.
- `api/email-auth.js`, `api/social-auth.js`, `api/diary.js`, `database/` — Node endpoints, auth and PostgreSQL schema.
- `ml/models_food100/`, `ml/models/` — Food100 model shards and Food50 fallback.
- `docs/` — verification reports and grading evidence.

## Deployment

`vercel.json` builds the Next.js static export into `web/out` and routes the Python and Node APIs. The browser uses `NEXT_PUBLIC_API_URL=/api`. `.vercelignore` excludes documentation and local QA files from the deployment bundle without removing them from GitHub. Configure environment variables in Vercel, never in public commits.

## What is and is not integrated yet

| Component | State on main |
|---|---|
| Food100 ONNX model | Model files and FastAPI inference integrated; production health returned HTTP 200 with 100 classes on 26 November 2026 |
| Camera and photo upload | UI and prediction endpoint present; real-photo production regression still needed |
| Nutrition estimates | Local lookup for a subset of labels, not all 100 |
| Email authentication | Node API with password hashing and server-side session; live valid/invalid login regression still needed |
| Google/Facebook authentication | Server API present; provider configuration and live sign-in must be verified |
| PostgreSQL | Neon schema and Node API present; production DATABASE_URL configured, actual account/diary persistence requires testing |
| Diary and reports | Social-account diary API uses user_id; email-account diary and some profile/report state remain browser-local |
| About/Contact | Public routes present; form delivery is not claimed without evidence |
| Responsive | [Report and screenshots](docs/RESPONSIVE_REPORT.md) record 18/18 cases at 375/768/1440px (team test) |
| Lighthouse | [CI artifacts](https://github.com/Tl4826/Myproject/actions/runs/45643857681) from a local build with mock API; production audit pending |
| GA4 / Sentry | Optional code integrated; team-owned IDs, consent review, dashboard evidence and production verification pending ([Issue #32](https://github.com/Tl4826/Myproject/issues/32)) |

Production GET checks on 26 November returned HTTP 200 and route-specific titles for `/`, `/about`, `/contact`, `/home`, `/diary`, `/baocao`. These checks do not prove authenticated behavior. See [Task 4 verification guidance](docs/TASK4_OBSERVABILITY.md) and [Issue #42](https://github.com/Tl4826/Myproject/issues/42) for review follow-up.

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
| Tuấn Anh | Node backend and database work |
| Hồng | Reporting, wireframes, planning, issues, self-reports |

## Caveats and academic integrity

Nutrition values are approximations per standard serving; a single image cannot provide reliably measured calories, portion weight or protein. Predictions can be wrong or uncertain. Do not use the prototype for medical advice. Cite all datasets, code and papers in the final report; see Food-101 and EfficientNet references in [ml/TRAIN_100.md](ml/TRAIN_100.md).

No passwords, personal photos, API keys, database URLs or `.env` secrets should be committed to this public repository.
