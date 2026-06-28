from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "PaperPilot"
    PROJECT_VERSION: str = "1.0.0"

    # 数据库配置
    DATABASE_URL: str = "sqlite:///./paperpilot.db"

    # JWT配置
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI服务配置
    AI_SERVICE_URL: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()