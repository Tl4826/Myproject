# Food Nutrition AI — NutriVN

> VNUK course project: image-based food recognition, a nutrition-estimate interface, a daily meal diary, and an experimental AI model service.

## Submission snapshot (26 November 2026)

- **Repository:** https://github.com/Tl4826/Myproject
- **Submission / production branch:** [`main`](https://github.com/Tl4826/Myproject/tree/main), confirmed by the project owner on 26 November 2026. GitHub's default branch is now `main`, verified through the repository API. The old `feature/web-vite` branch is preserved.
- **Production:** https://nutrivn-myproject.vercel.app (GA4/Sentry configured); https://nutrivn-main.vercel.app (second deployment). Both deploy `main`.
- **AI:** 100-class ONNX classifier (30 Vietnamese + 70 Food-101 classes), served by FastAPI, with a 50-class fallback.
- **Web:** Next.js 14 App Router, React 18, Tailwind CSS; camera/upload, top-3 prediction review, diary, reports, About and Contact.
- **Backend:** Vercel Node endpoints for email/social authentication and account-scoped diary; Neon PostgreSQL schema in `database/schema.sql`. Email credentials are checked server-side. New diary entries for verified email and social accounts use the server API; legacy email meals and some profile/report data remain device-local.
- **Limitations:** Nutrition estimates cover only a subset of labels. See the evidence links below for separately verified real-photo, authentication, diary and telemetry behavior.

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
  | email/social diary -> /api/diary -> account-scoped PostgreSQL
  | legacy email diary and some profile/report data -> browser storage
  + nutrition lookup, diary and reports
```

- `web/` — Next.js App Router frontend.
- `api/index.py`, `ml/service/` — Vercel FastAPI entry point and inference.
- `api/email-auth.js`, `api/social-auth.js`, `api/diary.js`, `database/` — Node endpoints, auth and PostgreSQL schema.
- `ml/models_food100/`, `ml/models/` — Food100 model shards and Food50 fallback.
- `docs/` — verification reports and grading evidence, including [retrospective wireframes and route comparison](docs/WIREFRAMES.md).

## Deployment

`vercel.json` builds the Next.js static export into `web/out` and routes the Python and Node APIs. The browser uses `NEXT_PUBLIC_API_URL=/api`. `.vercelignore` excludes documentation and local QA files from the deployment bundle without removing them from GitHub. Configure environment variables in Vercel, never in public commits.

## What is and is not integrated yet

| Component | State on main |
|---|---|
| Food100 ONNX model | Model files and FastAPI inference integrated; production health returned HTTP 200 with 100 classes on 26 November 2026 |
| Camera and photo upload | Production pizza upload, Top 1 pizza, selection and diary rendering passed ([real-photo test](https://github.com/Tl4826/Myproject/actions/runs/45799739417)); one photo is not an accuracy evaluation |
| Nutrition estimates | Local lookup for a subset of labels, not all 100 |
| Email authentication | Node API with password hashing and server-side session; registration, session validation and wrong/unregistered credentials tested on production ([AUTH evidence](https://github.com/Tl4826/Myproject/actions/runs/45799243828), [unregistered login](https://github.com/Tl4826/Myproject/actions/runs/45798437764)) |
| Google/Facebook authentication | Server API present; provider configuration and live sign-in must be verified |
| PostgreSQL | Neon PostgreSQL [schema and ERD](docs/database-schema.md); production authenticated diary CRUD passed in workflow 45799243828 |
| Diary and reports | New diary entries use account-scoped API for email/social accounts; [two-browser mock regression](https://github.com/Tl4826/Myproject/actions/runs/45816701285) and [production sync, edit/delete and report regression](https://github.com/Tl4826/Myproject/actions/runs/45823545267) passed. Legacy meals and saved profile/report state remain device-local |
| About/Contact | Public routes present; form delivery is not claimed without evidence |
| Responsive | [Report and screenshots](docs/RESPONSIVE_REPORT.md) record 18/18 cases at 375/768/1440px (team test) |
| Lighthouse | [CI artifacts after fixes](https://github.com/Tl4826/Myproject/actions/runs/45816700702) and [production evidence](docs/evidence/TASK4_RESULTS.md) for landing, diary and reports |
| GA4 / Sentry | Configured on nutrivn-myproject; consent regression, GA4/Sentry dashboard screenshots and server diagnostic ingestion evidence retained in [Task 4 results](docs/evidence/TASK4_RESULTS.md) |

Production GET checks on 26 November returned HTTP 200 and route-specific titles for `/`, `/about`, `/contact`, `/home`, `/diary`, `/baocao`. Both production deployments at 4b46f73 also returned healthy Food100 status. Authenticated tests are recorded separately. See [Task 4 verification guidance](docs/TASK4_OBSERVABILITY.md) and [Issue #42](https://github.com/Tl4826/Myproject/issues/42) for review follow-up.

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
| Tuấn Anh | Node backend and database work; authentication, ERD and PostgreSQL schema (PR #18, #46); later integration and QA in PR #54 |
| Hồng | Reporting, wireframes, planning, issues, self-reports |

## Caveats and academic integrity

Nutrition values are approximations per standard serving; a single image cannot provide reliably measured calories, portion weight or protein. Predictions can be wrong or uncertain. Do not use the prototype for medical advice. Cite all datasets, code and papers in the final report; see Food-101 and EfficientNet references in [ml/TRAIN_100.md](ml/TRAIN_100.md).

No passwords, personal photos, API keys, database URLs or `.env` secrets should be committed to this public repository.
