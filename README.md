# Food Nutrition AI

Web app: upload a meal photo, the model recognises the dish, the app shows calories and protein and saves the result to a database.
One repository for two VNUK courses: **Artificial Intelligence** (final project, 40%) and **Web Design and Development - CSB25022** (final project, 50%).

## Structure

| Folder | Purpose | Course |
|---|---|---|
| `ml/notebooks/` | Data prep, training, evaluation notebooks | AI |
| `ml/models/` | Exported model (`.onnx`) and `classes.json` (large files: link, do not commit) | AI |
| `data/` | Local sample images only (full datasets live on Colab/Kaggle) | AI |
| `web/` | Frontend (HTML, Tailwind, JS) and backend, database schema | Web |
| `docs/` | Wireframes, plan, ERD, weekly slides, sprint self-reports | Both |

## Team

| Member | Role |
|---|---|
| Venn | Dish recognition model, model service, repo owner |
| Huy | Backend, database, nutrition table, portion estimation |
| [member 3] | Frontend, Vietnamese dish photos |
| [member 4] | Wireframes, plan and issues, README/report, slides |

## How to run

1. ML: open `ml/notebooks/01_train_food_classifier.ipynb` in Google Colab (GPU runtime) and run all cells.
2. Web: [to be filled when `web/` exists].

## Rules

- One branch per feature (`feature/<name>`), small commits, every pull request linked to an issue, reviewed by another member.
- Every member writes a self-report for each of the 5 sprints (missing or late: -10% group mark).
- Cite every dataset, paper and borrowed code (VNUK plagiarism policy).

## Datasets

- Food-101 (ETH Zurich) - https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/
- Nutrition5k - for portion/nutrition estimation (RQ2, RQ3)
- Vietnamese food composition table (National Institute of Nutrition) - nutrition per 100 g
- Own Vietnamese dish photos - [count and classes to be filled]
