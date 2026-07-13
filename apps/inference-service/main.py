from fastapi import FastAPI
import asyncio
from contextlib import asynccontextmanager
from core.config import settings
from routers import health, risk
from services.model_service import model_service
from services.spatial_risk_engine import spatial_engine
from workers.iot_fallback_worker import run_worker

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML models
    model_service.load_model()
    
    # Start the background IoT worker to save container costs (Free Tier Strategy)
    worker_task = asyncio.create_task(run_worker())
    
    # Start Spatial Risk Engine Scheduler
    spatial_task = asyncio.create_task(spatial_engine.scheduler_loop(interval_minutes=30))
    
    yield
    
    # Shutdown: Clean up resources
    worker_task.cancel()
    spatial_task.cancel()
    try:
        await asyncio.gather(worker_task, spatial_task, return_exceptions=True)
    except asyncio.CancelledError:
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
