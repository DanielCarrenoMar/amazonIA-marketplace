# =============================================================================
# Dockerfile — inference-service (FastAPI / XGBoost)
# =============================================================================

FROM python:3.11-slim

LABEL org.opencontainers.image.title="amazonia-inference-service" \
      org.opencontainers.image.description="Motor de Inteligencia Artificial para el cálculo de riesgos logísticos"

# Evitar que Python escriba archivos .pyc y forzar logs sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependencias del sistema requeridas por XGBoost (libgomp1)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no root
RUN addgroup --system --gid 1001 pythonapp \
    && adduser --system --uid 1001 --gid 1001 pythonapp

WORKDIR /app

# Instalar dependencias primero para cachear la capa de pip
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente y los modelos pre-entrenados
COPY . .

# Cambiar permisos al usuario no root
RUN chown -R pythonapp:pythonapp /app

USER pythonapp

# Exponer el puerto de FastAPI
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Comando de inicio
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
