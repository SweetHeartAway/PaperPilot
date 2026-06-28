from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "PaperPilot"
    PROJECT_VERSION: str = "1.0.0"

    # 数据库配置
    DATABASE_URL: str = "sqlite:///./paperpilot.db"

    # JWT配置
    SECRET_KEY: str = "your-secret-key-here"  # 生产环境中应该从环境变量获取
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI服务配置
    AI_SERVICE_URL: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()