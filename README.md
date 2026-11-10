# Food Nutrition AI (NutriVN)

Web app: take or upload a meal photo, the model recognises the dish (12 dishes), the app shows calories and nutrition, saves the meal to a daily diary and tracks the calories left for the day.
One repository for two VNUK courses: **Artificial Intelligence** (final project, 40%) and **Web Design and Development - CSB25022** (final project, 50%).

## Product scope (agreed with lecturers)

- **Main tool (first page):** photo -> dish -> calories and nutrition.
- **Secondary tools (navigation bar):**
  - Daily calorie target from weight, height, age, sex, daily activity and goal (maintain, lose weight, gain weight, build muscle). Uses existing formulas (Mifflin-St Jeor BMR x activity factor), no model needed.
  - Daily diary: meals eaten today and calories left.
  - Daily tracking over time.
- **Recognised dishes (12):** phobo, buncha, comtam (Vietnamese) and spring_rolls, fried_rice, ramen, sushi, pizza, hamburger, french_fries, caesar_salad, omelette (from Food-101).
- Portions use default values per dish, so calories are estimates (see Limitations).

## Structure

| Folder / file | Purpose | Course |
|---|---|---|
| `ml/notebooks/` | Training and evaluation notebooks (`01` 10-dish baseline, `02` final 12-dish model) | AI |
| `ml/service/` | Model service: FastAPI + ONNX Runtime, `POST /predict` | AI / Web |
| `ml/models/` | Exported model `food_classifier.onnx` and `classes.json` | AI |
| `data/` | Local sample images only (full datasets live on Colab) | AI |
| `web/` | Frontend (Vite, Tailwind, JavaScript) | Web |
| `api/` | Backend routes (Node.js, deployed on Vercel) and database access | Web |
| `docs/` | Wireframes, plan, ERD, sprint self-reports, deployment notes | Both |
| `Dockerfile` | Builds the model service for Render | AI / Web |
| `vercel.json` | Vercel build configuration | Web |

## Architecture

Frontend (`web/`) -> backend (`api/`, `POST /api/analyze`) -> model service (`POST /predict`) -> nutrition lookup -> response. Meals are stored in MySQL.

- Model service: deployed on Render (`ml/service`, built by `Dockerfile` from branch `master`). Do not move or rename `ml/` or `Dockerfile` without updating Render.
- Web and backend: deployed on Vercel.
- The backend reads the model service address from the `MODEL_URL` environment variable.

## Team

| Member | Role |
|---|---|
| Venn (Thanh) | Dish recognition model, model service, deployment of the model service, repo owner and pull request review |
| Huy | Frontend (Tailwind, JavaScript, responsive). AI course: nutrition table and portion estimation, API comparison |
| Tuấn Anh | Backend (Node.js), MySQL database, nutrition data. AI course: data collection (dish photos) |
| Hồng | Report, README, wireframes (Figma), plan and issues, self-report collection; supports the backend and database |

## How to run

1. **Model training (AI):** open `ml/notebooks/02_train_food_vn.ipynb` in Google Colab (GPU runtime) and run all cells. `01_train_food_classifier.ipynb` is the 10-dish baseline.
2. **Model service (local):**
   ```
   cd ml/service
   python -m venv .venv
   .venv\Scripts\python -m pip install -r requirements.txt   # Windows PowerShell
   .venv\Scripts\python -m uvicorn app:app --port 8000
   ```
   Needs `ml/models/food_classifier.onnx` and `classes.json`. Open `http://localhost:8000/docs` to test. Windows also needs the Microsoft Visual C++ Redistributable (x64).
3. **Web and backend:** see `docs/VERCEL.md`. Set `MODEL_URL` to the model service address and add the MySQL connection variables in Vercel.

## Rules

- One branch per feature (`feature/<name>`), small commits, every pull request linked to an issue, reviewed by another member. The default branch is `master`.
- Do not commit secrets (database passwords, API keys); use environment variables.
- Every member writes a self-report for each of the 5 sprints (missing or late: -10% group mark).
- Cite every dataset, paper and borrowed code (VNUK plagiarism policy).

## Datasets and sources

- **Food-101** (Bossard, Guillaumin, Van Gool, ECCV 2014) - https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/ : 9 of the 12 dishes.
- **Own Vietnamese dish photos** (phobo, buncha, comtam), collected by the team - [count per class and photographer to be filled].
- **Nutrition values:** each dish and its source are listed in the nutrition table (`nutrition.json`); every row must cite its source and the portion used.

## Results (model)

- 12 classes, EfficientNet-B0 fine-tuned with PyTorch, exported to ONNX.
- Test accuracy 0.907, macro F1 0.842 on the test split (Vietnamese part of this split is small).
- Extra test on 63 own Vietnamese photos: [to be confirmed after checking for overlap with training photos].

## Limitations

- Only 12 dishes; 9 of them are not Vietnamese. Vietnamese dishes have far fewer training photos, so the model is less confident on them. More Vietnamese photos is the main next step.
- Portions are defaults per dish, so calories are estimates.
- The model returns a confidence score, which is not the same as accuracy.
