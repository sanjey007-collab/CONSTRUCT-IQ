import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ConstructIQ"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "constructiq-insecure-supersecret-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for development/demo

    # Database: SQLite default for local zero-dependency out-of-the-box run, PostgreSQL via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./constructiq.db")

    # Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-3.8-flash"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    # Default Autonomous Policy Limits (in INR ₹)
    MAX_AUTONOMOUS_PROCUREMENT: float = 25000.0
    MAX_AUTONOMOUS_TRANSFER: float = 50000.0

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
