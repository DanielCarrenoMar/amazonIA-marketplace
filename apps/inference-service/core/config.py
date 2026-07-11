from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AmazonIA 4.0 - Inference Service"
    VERSION: str = "1.0.0"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_TOKEN: str = ""
    
    @property
    def get_redis_tcp_url(self) -> str:
        url = self.REDIS_URL
        if url.startswith("https://"):
            host = url.replace("https://", "")
            if host.endswith("/"):
                host = host[:-1]
            return f"rediss://default:{self.REDIS_TOKEN}@{host}:6379"
        return url
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "telemetria"
    
    # Postgres
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/amazonia"
    
    # JWT
    JWT_SECRET_KEY: str = "SUPER_SECRET_KEY_CHANGE_ME"
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()
