import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.utils.database import Base
from app.core.config import settings

# 创建测试数据库引擎
TEST_DATABASE_URL = "sqlite:///./test_paperpilot.db"
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
    """创建测试客户端"""
    from fastapi.testclient import TestClient
    from app.main import app

    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()