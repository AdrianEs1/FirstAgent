# Imagen base de Python
FROM python:3.11-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar e instalar dependencias
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copiar todo el código del backend al contenedor
COPY . .

# Exponer el puerto (el mismo que usa tu app.py)
EXPOSE 5000

# Comando para iniciar el servidor
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000",
"--reload"]