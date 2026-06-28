"""用户认证模块测试"""

import pytest
from fastapi.testclient import TestClient


def test_register_user(test_client):
    """测试用户注册"""
    response = test_client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "id" in data
    assert "password" not in data


def test_register_duplicate_email(test_client):
    """测试重复邮箱注册"""
    # 先注册一个用户
    test_client.post("/api/v1/auth/register", json={
        "email": "duplicate@example.com",
        "username": "user1",
        "password": "testpass123"
    })
    # 用相同邮箱注册另一个用户
    response = test_client.post("/api/v1/auth/register", json={
        "email": "duplicate@example.com",
        "username": "user2",
        "password": "testpass456"
    })
    assert response.status_code == 400
    assert "邮箱" in response.json()["detail"]


def test_register_duplicate_username(test_client):
    """测试重复用户名注册"""
    test_client.post("/api/v1/auth/register", json={
        "email": "user1@example.com",
        "username": "sameuser",
        "password": "testpass123"
    })
    response = test_client.post("/api/v1/auth/register", json={
        "email": "user2@example.com",
        "username": "sameuser",
        "password": "testpass456"
    })
    assert response.status_code == 400
    assert "用户名" in response.json()["detail"]


def test_login_success(test_client):
    """测试用户登录成功"""
    # 先注册
    test_client.post("/api/v1/auth/register", json={
        "email": "login@example.com",
        "username": "loginuser",
        "password": "mypassword"
    })
    # 登录（使用邮箱）
    response = test_client.post("/api/v1/auth/login", data={
        "username": "login@example.com",
        "password": "mypassword"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_with_username(test_client):
    """测试使用用户名登录"""
    test_client.post("/api/v1/auth/register", json={
        "email": "email@example.com",
        "username": "cooluser",
        "password": "mypassword"
    })
    response = test_client.post("/api/v1/auth/login", data={
        "username": "cooluser",
        "password": "mypassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(test_client):
    """测试错误密码登录"""
    test_client.post("/api/v1/auth/register", json={
        "email": "wrong@example.com",
        "username": "wronguser",
        "password": "correctpass"
    })
    response = test_client.post("/api/v1/auth/login", data={
        "username": "wrong@example.com",
        "password": "wrongpass"
    })
    assert response.status_code == 401


def test_login_wrong_username(test_client):
    """测试不存在的用户登录"""
    response = test_client.post("/api/v1/auth/login", data={
        "username": "nonexistent@example.com",
        "password": "somepass"
    })
    assert response.status_code == 401


def test_login_with_disabled_user(test_client, db_session):
    """测试已禁用用户登录"""
    # 先注册
    test_client.post("/api/v1/auth/register", json={
        "email": "disable@example.com",
        "username": "disableuser",
        "password": "testpass123"
    })
    # 在测试数据库中禁用用户
    from app.models.user import User
    user = db_session.query(User).filter(User.email == "disable@example.com").first()
    user.is_active = False
    db_session.commit()

    response = test_client.post("/api/v1/auth/login", data={
        "username": "disable@example.com",
        "password": "testpass123"
    })
    assert response.status_code == 403


def test_register_invalid_email(test_client):
    """测试无效邮箱格式"""
    response = test_client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "username": "validuser",
        "password": "testpass123"
    })
    assert response.status_code == 422


def test_register_short_password(test_client):
    """测试密码太短（< 8位）"""
    response = test_client.post("/api/v1/auth/register", json={
        "email": "short@example.com",
        "username": "shortuser",
        "password": "short"
    })
    assert response.status_code == 422


def test_register_short_username(test_client):
    """测试用户名太短（< 3位）"""
    response = test_client.post("/api/v1/auth/register", json={
        "email": "short@example.com",
        "username": "ab",
        "password": "testpass123"
    })
    assert response.status_code == 422
