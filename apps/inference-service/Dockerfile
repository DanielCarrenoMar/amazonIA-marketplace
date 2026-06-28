# Usa la versión oficial y ligera de Python 3.12
FROM python:3.12-slim

# Evita que Python escriba archivos .pyc en el disco
ENV PYTHONDONTWRITEBYTECODE=1
# Evita que la salida de Python se almacene en búfer, enviándola directo a la terminal
ENV PYTHONUNBUFFERED=1

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias del sistema requeridas por XGBoost y otras librerías
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copiar solo el archivo de requerimientos para aprovechar la caché de Docker
COPY requirements.txt .

# Instalar las librerías de Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código del microservicio
COPY . .

# Exponer el puerto de FastAPI
EXPOSE 8000

# Comando para iniciar la aplicación (Render inyectará el puerto dinámicamente)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
