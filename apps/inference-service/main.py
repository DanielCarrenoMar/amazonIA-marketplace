from fastapi import FastAPI
from contextlib import asynccontextmanager
from core.config import settings
from routers import health, risk
from services.model_service import model_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML models
    model_service.load_model()
    yield
    # Shutdown: Clean up resources
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Predictive Logistics Risk Engine for the Amazon Basin",
    lifespan=lifespan
)

# Include routers
app.include_router(health.router)
app.include_router(risk.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the AmazonIA 4.0 Inference Service"}
