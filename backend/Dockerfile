# Etapa 1: build (instalación de dependencias)
FROM python:3.11-slim AS builder

WORKDIR /app

# Instala herramientas mínimas necesarias para compilar dependencias
RUN apt-get update && apt-get install -y --no-install-recommends build-essential gcc && \
    rm -rf /var/lib/apt/lists/*

# Instalar dependencias sin cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Etapa 2: imagen final (limpia)
FROM python:3.11-slim

WORKDIR /app

# Copiar dependencias ya instaladas desde la imagen builder
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin

# Copiar solo tu aplicación (no todo el entorno local)
COPY . .

EXPOSE 5000

# Comando para producción
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
