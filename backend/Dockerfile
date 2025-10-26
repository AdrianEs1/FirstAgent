# Etapa 1: build
FROM python:3.11-slim AS builder
WORKDIR /app

# Instalar herramientas necesarias para compilar
RUN apt-get update && apt-get install -y --no-install-recommends build-essential gcc && \
    rm -rf /var/lib/apt/lists/*

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Etapa 2: imagen final
FROM python:3.11-slim
WORKDIR /app

# Copiar dependencias compiladas
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin

# Copiar aplicación
COPY . .

# Render detectará este puerto automáticamente
EXPOSE 5000

# Ejecutar FastAPI con el puerto dinámico de Render
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-5000}"]
