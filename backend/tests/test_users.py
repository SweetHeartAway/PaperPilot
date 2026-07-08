"""用户信息模块测试"""


def _register_and_login(test_client, email="me@example.com", username="meuser"):
    """辅助函数：注册并登录，返回token"""
    test_client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": "testpass123"},
    )
    response = test_client.post(
        "/api/v1/auth/login", data={"username": email, "password": "testpass123"}
    )
    return response.json()["access_token"]


def test_get_current_user(test_client):
    """测试获取当前用户信息"""
    token = _register_and_login(test_client)
    response = test_client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
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
    response = test_client.get(
        "/api/v1/users/me", headers={"Authorization": "Bearer invalid_token_here"}
    )
    assert response.status_code == 401


def test_get_user_by_id(test_client):
    """测试通过ID获取用户"""
    token = _register_and_login(test_client, email="byid@example.com", username="byiduser")

    # 先获取当前用户信息得到id
    me = test_client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    user_id = me.json()["id"]

    # 用ID查询（需登录）
    response = test_client.get(
        f"/api/v1/users/{user_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "byid@example.com"
    assert data["username"] == "byiduser"


def test_get_user_not_found(test_client):
    """测试查询不存在的用户（需登录）"""
    token = _register_and_login(test_client, email="notfound@example.com", username="notfound")
    response = test_client.get("/api/v1/users/99999", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 404


def test_multiple_users_independent(test_client):
    """测试多个用户数据独立"""
    token1 = _register_and_login(test_client, email="user_a@example.com", username="usera")
    token2 = _register_and_login(test_client, email="user_b@example.com", username="userb")

    me1 = test_client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token1}"})
    me2 = test_client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token2}"})

    assert me1.json()["email"] == "user_a@example.com"
    assert me2.json()["email"] == "user_b@example.com"
    assert me1.json()["id"] != me2.json()["id"]


# ---------------------------------------------------------------------------
# 更新资料
# ---------------------------------------------------------------------------


class TestUpdateProfile:
    """更新用户资料"""

    def test_update_username_success(self, test_client):
        """更新用户名成功"""
        token = _register_and_login(test_client)
        headers = {"Authorization": f"Bearer {token}"}

        resp = test_client.put(
            "/api/v1/users/me",
            json={"username": "newusername"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "newusername"

    def test_update_email_success(self, test_client):
        """更新邮箱成功"""
        token = _register_and_login(test_client)
        headers = {"Authorization": f"Bearer {token}"}

        resp = test_client.put(
            "/api/v1/users/me",
            json={"email": "newemail@example.com"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "newemail@example.com"

    def test_update_duplicate_email(self, test_client):
        """更新到已存在的邮箱返回 409"""
        _register_and_login(test_client, email="user_a@example.com", username="usera")
        token_b = _register_and_login(test_client, email="user_b@example.com", username="userb")

        resp = test_client.put(
            "/api/v1/users/me",
            json={"email": "user_a@example.com"},
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp.status_code == 409
        assert "邮箱" in resp.json()["detail"]

    def test_update_duplicate_username(self, test_client):
        """更新到已存在的用户名返回 409"""
        _register_and_login(test_client, email="user_a@example.com", username="usera")
        token_b = _register_and_login(test_client, email="user_b@example.com", username="userb")

        resp = test_client.put(
            "/api/v1/users/me",
            json={"username": "usera"},
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp.status_code == 409
        assert "用户名" in resp.json()["detail"]

    def test_update_ai_preferences(self, test_client):
        """更新 AI 偏好"""
        token = _register_and_login(test_client)
        headers = {"Authorization": f"Bearer {token}"}

        resp = test_client.put(
            "/api/v1/users/me",
            json={
                "ai_api_key": "sk-test-key",
                "ai_base_url": "https://api.example.com",
                "ai_model": "gpt-4",
            },
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ai_api_key"] == "sk-test-key"
        assert data["ai_base_url"] == "https://api.example.com"
        assert data["ai_model"] == "gpt-4"

    def test_update_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.put(
            "/api/v1/users/me",
            json={"username": "hacker"},
        )
        assert resp.status_code == 401

    def test_update_username_too_short(self, test_client):
        """用户名太短返回 422"""
        token = _register_and_login(test_client)
        resp = test_client.put(
            "/api/v1/users/me",
            json={"username": "ab"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 修改密码
# ---------------------------------------------------------------------------


class TestChangePassword:
    """修改密码"""

    def test_change_password_success(self, test_client):
        """修改密码成功"""
        token = _register_and_login(test_client)
        headers = {"Authorization": f"Bearer {token}"}

        resp = test_client.post(
            "/api/v1/users/me/change-password",
            json={"current_password": "testpass123", "new_password": "newpass12345"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["message"] == "密码修改成功"

        # 用新密码能登录
        login_resp = test_client.post(
            "/api/v1/auth/login",
            data={"username": "me@example.com", "password": "newpass12345"},
        )
        assert login_resp.status_code == 200

    def test_change_password_wrong_current(self, test_client):
        """当前密码错误返回 400"""
        token = _register_and_login(test_client)
        headers = {"Authorization": f"Bearer {token}"}

        resp = test_client.post(
            "/api/v1/users/me/change-password",
            json={"current_password": "wrongpass", "new_password": "newpass12345"},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "密码错误" in resp.json()["detail"]

    def test_change_password_too_short(self, test_client):
        """新密码太短返回 422"""
        token = _register_and_login(test_client)
        headers = {"Authorization": f"Bearer {token}"}

        resp = test_client.post(
            "/api/v1/users/me/change-password",
            json={"current_password": "testpass123", "new_password": "short"},
            headers=headers,
        )
        assert resp.status_code == 422

    def test_change_password_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.post(
            "/api/v1/users/me/change-password",
            json={"current_password": "test", "new_password": "newpass12345"},
        )
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# 头像上传/删除
# ---------------------------------------------------------------------------


class TestAvatar:
    """头像上传和删除"""

    def _auth(self, test_client) -> tuple[str, dict]:
        token = _register_and_login(test_client)
        return token, {"Authorization": f"Bearer {token}"}

    def _mini_png(self) -> bytes:
        """最小的有效 PNG 文件（1x1 像素）"""
        return bytes(
            [
                0x89,
                0x50,
                0x4E,
                0x47,
                0x0D,
                0x0A,
                0x1A,
                0x0A,  # PNG signature
                0x00,
                0x00,
                0x00,
                0x0D,
                0x49,
                0x48,
                0x44,
                0x52,  # IHDR chunk
                0x00,
                0x00,
                0x00,
                0x01,
                0x00,
                0x00,
                0x00,
                0x01,
                0x08,
                0x02,
                0x00,
                0x00,
                0x00,
                0x90,
                0x77,
                0x53,
                0xDE,
                0x00,
                0x00,
                0x00,
                0x0C,
                0x49,
                0x44,
                0x41,  # IDAT chunk
                0x54,
                0x08,
                0xD7,
                0x63,
                0x60,
                0x60,
                0x00,
                0x00,
                0x00,
                0x02,
                0x00,
                0x01,
                0xE4,
                0x27,
                0xD7,
                0x60,
                0x00,
                0x00,
                0x00,
                0x00,
                0x49,
                0x45,
                0x4E,
                0x44,  # IEND chunk
                0xAE,
                0x42,
                0x60,
                0x82,
            ]
        )

    def test_upload_avatar_success(self, test_client):
        """上传头像成功"""
        _, headers = self._auth(test_client)

        resp = test_client.post(
            "/api/v1/users/me/avatar",
            files={"file": ("avatar.png", self._mini_png(), "image/png")},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["avatar_uuid"] is not None
        assert data["avatar_url"] is not None

    def test_upload_avatar_invalid_type(self, test_client):
        """不支持的文件类型返回 400"""
        _, headers = self._auth(test_client)

        resp = test_client.post(
            "/api/v1/users/me/avatar",
            files={"file": ("avatar.txt", b"not an image", "text/plain")},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "不支持" in resp.json()["detail"]

    def test_upload_avatar_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.post(
            "/api/v1/users/me/avatar",
            files={"file": ("avatar.png", b"fake", "image/png")},
        )
        assert resp.status_code == 401

    def test_delete_avatar_success(self, test_client):
        """删除头像成功"""
        _, headers = self._auth(test_client)

        # 先上传
        test_client.post(
            "/api/v1/users/me/avatar",
            files={"file": ("del.png", self._mini_png(), "image/png")},
            headers=headers,
        )

        # 删除
        resp = test_client.delete("/api/v1/users/me/avatar", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["avatar_uuid"] is None
        assert data["avatar_url"] is None

    def test_delete_avatar_no_avatar(self, test_client):
        """未设置头像时删除返回 404"""
        _, headers = self._auth(test_client)

        resp = test_client.delete("/api/v1/users/me/avatar", headers=headers)
        assert resp.status_code == 404
        assert "未设置" in resp.json()["detail"]

    def test_delete_avatar_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.delete("/api/v1/users/me/avatar")
        assert resp.status_code == 401

    def test_get_avatar_file(self, test_client):
        """获取头像文件"""
        _, headers = self._auth(test_client)

        # 上传头像
        upload_resp = test_client.post(
            "/api/v1/users/me/avatar",
            files={"file": ("get.png", self._mini_png(), "image/png")},
            headers=headers,
        )
        avatar_url = upload_resp.json()["avatar_url"]

        # 获取头像文件
        resp = test_client.get(avatar_url, headers=headers)
        assert resp.status_code == 200
        assert resp.headers["content-type"] in ("image/png", "application/octet-stream")

    def test_get_avatar_nonexistent(self, test_client):
        """不存在的用户头像返回 404"""
        token = _register_and_login(test_client)
        resp = test_client.get(
            "/api/v1/users/99999/avatar",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 404
