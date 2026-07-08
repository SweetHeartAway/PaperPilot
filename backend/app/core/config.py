"""应用配置 — Pydantic Settings"""

from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PaperPilot"
    PROJECT_VERSION: str = "1.0.0"

    # 数据库配置
    DATABASE_URL: str = "sqlite:///./paperpilot.db"

    # JWT配置
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI服务配置
    AI_API_KEY: str = ""  # OpenAI 兼容 API Key，为空时启用本地桩实现
    AI_API_BASE_URL: str = ""  # API 地址，切换模型时修改
    # DeepSeek: https://api.deepseek.com
    # GLM-4:    https://open.bigmodel.cn/api/paas/v4
    # Qwen:     https://dashscope.aliyuncs.com/compatible-mode/v1
    # OpenAI:   https://api.openai.com/v1（默认）
    # Ollama:   http://localhost:11434/v1
    AI_MODEL: str = "gpt-4o-mini"  # 模型名称，切换模型时修改
    AI_MAX_TOKENS: int = 4096  # 最大输出 token 数

    # Embedding 服务配置
    EMBEDDING_PROVIDER: str = "openai"  # openai | jina | bge
    EMBEDDING_MODEL: str = "text-embedding-3-small"  # 模型名称
    EMBEDDING_API_KEY: str = ""  # 为空时复用 AI_API_KEY
    EMBEDDING_BASE_URL: str = ""  # 为空时复用 AI_API_BASE_URL
    BGE_MODEL_NAME: str = "BAAI/bge-small-zh-v1.5"  # BGE 本地模型

    # 向量数据库配置
    VECTOR_DB_PROVIDER: str = "chroma"  # chroma | milvus（扩展用）
    CHROMA_PERSIST_DIR: str = "./chroma_db"  # Chroma 数据目录
    VECTOR_COLLECTION_NAME: str = "papers"  # 集合名称

    # 文件上传配置
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB（默认值）

    # CORS 配置
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    """允许的跨源域名，多个用逗号分隔。生产环境需改为实际域名。"""

    @field_validator("MAX_UPLOAD_SIZE", mode="before")
    @classmethod
    def parse_max_upload_size(cls, v: Any) -> int:
        """支持人类可读的文件大小格式：50MB、1GB、512KB 或纯字节数"""
        if isinstance(v, str):
            v = v.strip().upper()
            if v.endswith("GB"):
                return int(v[:-2]) * 1024 * 1024 * 1024
            if v.endswith("MB"):
                return int(v[:-2]) * 1024 * 1024
            if v.endswith("KB"):
                return int(v[:-2]) * 1024
            return int(v)
        return int(v)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
