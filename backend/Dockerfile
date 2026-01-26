# Etapa 1: build
FROM python:3.11-slim AS builder
WORKDIR /app

# Dependencias de compilación
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Etapa 2: imagen final
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONPATH=/app

# Copiar dependencias instaladas
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin

# Copiar aplicación
COPY . .

# Cloud Run usa SIEMPRE el puerto 8080
EXPOSE 8080

# Ejecutar FastAPI en Cloud Run
CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port $PORT"]

