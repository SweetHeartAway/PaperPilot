import os
import tempfile

import pytest
from app.core.config import settings

# 提前导入所有模型，确保Base.metadata已有表信息
from app.models import AIAnalysis, Paper, Tag, User  # noqa: F401
from app.utils.database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 使用独立的测试数据库文件
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_paperpilot.db")
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

# 删除旧的测试数据库
if os.path.exists(TEST_DB_PATH):
    os.remove(TEST_DB_PATH)

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """创建测试数据库会话"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def test_client(db_session):
    """创建测试客户端（含隔离的上传目录）"""
    from fastapi.testclient import TestClient
    from main import app

    # 使用临时目录作为上传目录，隔离测试文件
    tmp_upload = tempfile.mkdtemp()
    old_upload_dir = settings.UPLOAD_DIR
    settings.UPLOAD_DIR = tmp_upload

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
    settings.UPLOAD_DIR = old_upload_dir

    # 清理临时上传目录
    import shutil

    if os.path.exists(tmp_upload):
        shutil.rmtree(tmp_upload)
