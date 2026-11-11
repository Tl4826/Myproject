# Deploy the app and model API together on Vercel

This repository is configured as a Vercel monorepo deployment:

- Vite/React frontend: `web/` (built to `web/dist`)
- FastAPI image-classification endpoint: `api/index.py`
- ONNX model and labels: `ml/models/` (bundled with the function)
- `GET /api/health` checks the API; `POST /api/predict` accepts multipart form data with an image field named `file`.

## Deploy

1. Push or merge `feature/web-vite` to the branch you want to deploy.
2. In Vercel, choose **Add New → Project** and import `Tl4826/Myproject`.
3. Keep the project **Root Directory** as `.` (the repository root), not `web`.
4. Deploy. `vercel.json` supplies the frontend build/output settings and routes `/api/*` to the Python function. The production frontend is configured to call `/api` on the same deployment, so no separate API URL or CORS setup is needed.
5. After deployment, check `https://<your-deployment>.vercel.app/api/health`. It should return `{"ok":true,...}`. Then test a small image using the app's scan feature.

The root `requirements.txt` contains only the API runtime dependencies so the function does not install the notebook/training stack. Install training dependencies locally with `pip install -r ml/requirements.txt`.

## Notes

- Vercel's function request-body and execution limits apply to uploaded images and model inference. Large uploads or slow cold starts may exceed the plan's limits; if that happens, use a smaller image or host the inference API on a container service and set `VITE_API_URL` to that API's URL before building the frontend.
- Vercel does not deploy from this GitHub change by itself. A Vercel project must be connected to the repository and authorized by someone with access to the Vercel account.
