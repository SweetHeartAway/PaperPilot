"""用户信息模块测试"""

import pytest
from fastapi.testclient import TestClient


def _register_and_login(test_client, email="me@example.com", username="meuser"):
    """辅助函数：注册并登录，返回token"""
    test_client.post("/api/v1/auth/register", json={
        "email": email,
        "username": username,
        "password": "testpass123"
    })
    response = test_client.post("/api/v1/auth/login", data={
        "username": email,
        "password": "testpass123"
    })
    return response.json()["access_token"]


def test_get_current_user(test_client):
    """测试获取当前用户信息"""
    token = _register_and_login(test_client)
    response = test_client.get("/api/v1/users/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["username"] == "meuser"
    assert "id" in data


def test_get_current_user_no_token(test_client):
    """测试未携带token访问用户信息"""
    response = test_client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_get_current_user_invalid_token(test_client):
    """测试携带无效token"""
    response = test_client.get("/api/v1/users/me", headers={
        "Authorization": "Bearer invalid_token_here"
    })
    assert response.status_code == 401


def test_get_user_by_id(test_client):
    """测试通过ID获取用户"""
    token = _register_and_login(test_client, email="byid@example.com", username="byiduser")

    # 先获取当前用户信息得到id
    me = test_client.get("/api/v1/users/me", headers={
        "Authorization": f"Bearer {token}"
    })
    user_id = me.json()["id"]

    # 用ID查询（需登录）
    response = test_client.get(
        f"/api/v1/users/{user_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "byid@example.com"
    assert data["username"] == "byiduser"


def test_get_user_not_found(test_client):
    """测试查询不存在的用户（需登录）"""
    token = _register_and_login(test_client, email="notfound@example.com", username="notfound")
    response = test_client.get(
        "/api/v1/users/99999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 404


def test_multiple_users_independent(test_client):
    """测试多个用户数据独立"""
    token1 = _register_and_login(test_client, email="user_a@example.com", username="usera")
    token2 = _register_and_login(test_client, email="user_b@example.com", username="userb")

    me1 = test_client.get("/api/v1/users/me", headers={
        "Authorization": f"Bearer {token1}"
    })
    me2 = test_client.get("/api/v1/users/me", headers={
        "Authorization": f"Bearer {token2}"
    })

    assert me1.json()["email"] == "user_a@example.com"
    assert me2.json()["email"] == "user_b@example.com"
    assert me1.json()["id"] != me2.json()["id"]
