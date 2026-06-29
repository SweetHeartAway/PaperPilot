from app.api.v1 import ai, auth, papers, prompts, tags, users
from app.core.config import settings
from app.models import Base
from app.utils.database import engine
from fastapi import FastAPI

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, description="AI论文管理平台", version="1.0.0")

# 注册API路由
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(papers.router, prefix="/api/v1/papers", tags=["papers"])
app.include_router(tags.router, prefix="/api/v1/tags", tags=["tags"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(prompts.router, prefix="/api/v1", tags=["prompts"])


@app.get("/")
def read_root():
    return {"message": "Welcome to PaperPilot - AI论文管理平台"}
