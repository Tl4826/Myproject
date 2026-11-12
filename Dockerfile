# Staging Docker image: serves Food100 by default, with Food50 rollback available.
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY ml/service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ml/assemble_food100.py ml/assemble_food100.py
COPY ml/service ml/service
COPY ml/models ml/models
COPY ml/models_food100 ml/models_food100
ENV FOOD_MODEL_VARIANT=100
# Model shards are checksum verified and assembled in writable /tmp at startup.
CMD ["sh", "-c", "uvicorn ml.service.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
