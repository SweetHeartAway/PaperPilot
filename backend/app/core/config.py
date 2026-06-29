"""应用配置 — Pydantic Settings"""

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
    AI_SERVICE_URL: str | None = None
    AI_API_KEY: str = ""  # OpenAI 兼容 API Key，为空时启用本地桩实现
    AI_API_BASE_URL: str = ""  # API 地址，切换模型时修改
    # DeepSeek: https://api.deepseek.com
    # GLM-4:    https://open.bigmodel.cn/api/paas/v4
    # Qwen:     https://dashscope.aliyuncs.com/compatible-mode/v1
    # OpenAI:   https://api.openai.com/v1（默认）
    # Ollama:   http://localhost:11434/v1
    AI_MODEL: str = "gpt-4o-mini"  # 模型名称，切换模型时修改
    AI_MAX_TOKENS: int = 4096  # 最大输出 token 数

    # 文件上传配置
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
