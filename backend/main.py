import logging

from app.api.v1 import ai, auth, papers, prompts, tags, users
from app.core.config import settings
from app.models import Base
from app.utils.database import engine
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, description="AI论文管理平台", version="1.0.0")

# ─── 全局异常处理 ───


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """保留原有 HTTPException 的 status_code 和 detail，确保 JSON 格式统一"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """未捕获异常兜底 — 避免泄露内部实现细节"""
    logger.exception("未捕获的服务器异常: %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


# CORS 中间件 — 开发环境允许前端跨源访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
