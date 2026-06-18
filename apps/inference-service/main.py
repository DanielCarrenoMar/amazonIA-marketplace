from fastapi import FastAPI
from core.config import settings
from routers import health, risk

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Predictive Logistics Risk Engine for the Amazon Basin"
)

# Include routers
app.include_router(health.router)
app.include_router(risk.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the AmazonIA 4.0 Inference Service"}
