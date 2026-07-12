from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AmazonIA 4.0 - Inference Service"
    VERSION: str = "1.0.0"
    
    # Redis (Upstash HTTP REST)
    REDIS_URL: str = "https://localhost"
    REDIS_TOKEN: str = ""
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "telemetria"
    
    # Postgres
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/amazonia"
    
    # JWT
    JWT_SECRET_KEY: str = "SUPER_SECRET_KEY_CHANGE_ME"
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = "../../.env"
        extra = "ignore"

settings = Settings()
