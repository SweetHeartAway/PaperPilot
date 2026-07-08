"""提示词模板测试 — CRUD + 设为默认"""

from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------


def _auth_header(test_client: TestClient, suffix: str = "") -> dict:
    """注册并登录，返回 Authorization header"""
    test_client.post(
        "/api/v1/auth/register",
        json={
            "email": f"prompt{suffix}@test.com",
            "username": f"promptuser{suffix}",
            "password": "password123",
        },
    )
    resp = test_client.post(
        "/api/v1/auth/login",
        data={"username": f"prompt{suffix}@test.com", "password": "password123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


_SAMPLE_SYSTEM_PROMPT = "你是一个专业的论文摘要助手。请用中文总结以下论文的核心内容。"


def _create_prompt(
    test_client: TestClient,
    headers: dict,
    name: str = "默认摘要模板",
    analysis_type: str = "summary",
    **kwargs,
) -> dict:
    """创建提示词模板并返回响应 JSON"""
    data = {
        "name": name,
        "analysis_type": analysis_type,
        "system_prompt": _SAMPLE_SYSTEM_PROMPT,
        **kwargs,
    }
    resp = test_client.post("/api/v1/prompts/", json=data, headers=headers)
    return resp


# ---------------------------------------------------------------------------
# 创建模板
# ---------------------------------------------------------------------------


class TestCreatePrompt:
    """创建提示词模板"""

    def test_create_success(self, test_client):
        """正常创建"""
        resp = _create_prompt(test_client, _auth_header(test_client))
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "默认摘要模板"
        assert data["analysis_type"] == "summary"
        assert data["system_prompt"] == _SAMPLE_SYSTEM_PROMPT
        assert "id" in data
        assert data["is_default"] is False

    def test_create_with_all_fields(self, test_client):
        """创建时包含所有可选字段"""
        headers = _auth_header(test_client)
        resp = _create_prompt(
            test_client,
            headers,
            name="完整模板",
            description="这是一个测试模板",
            user_prompt_template="论文题目：{title}\n内容：{content}",
            is_default=True,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["description"] == "这是一个测试模板"
        assert data["user_prompt_template"] == "论文题目：{title}\n内容：{content}"
        assert data["is_default"] is True

    def test_create_duplicate_name(self, test_client):
        """同名模板返回 409"""
        headers = _auth_header(test_client)
        _create_prompt(test_client, headers, name="唯一名称")
        resp = _create_prompt(test_client, headers, name="唯一名称")
        assert resp.status_code == 409
        assert "已存在" in resp.json()["detail"]

    def test_create_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.post(
            "/api/v1/prompts/",
            json={"name": "test", "analysis_type": "summary", "system_prompt": "test"},
        )
        assert resp.status_code == 401

    def test_create_invalid_analysis_type(self, test_client):
        """无效 analysis_type 返回 422"""
        headers = _auth_header(test_client)
        resp = test_client.post(
            "/api/v1/prompts/",
            json={
                "name": "invalid",
                "analysis_type": "invalid_type",
                "system_prompt": "test",
            },
            headers=headers,
        )
        assert resp.status_code == 422

    def test_create_empty_name(self, test_client):
        """空名称返回 422"""
        headers = _auth_header(test_client)
        resp = test_client.post(
            "/api/v1/prompts/",
            json={
                "name": "",
                "analysis_type": "summary",
                "system_prompt": "test",
            },
            headers=headers,
        )
        assert resp.status_code == 422

    def test_create_empty_system_prompt(self, test_client):
        """空 system_prompt 返回 422"""
        headers = _auth_header(test_client)
        resp = test_client.post(
            "/api/v1/prompts/",
            json={
                "name": "test",
                "analysis_type": "summary",
                "system_prompt": "",
            },
            headers=headers,
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 列表查询
# ---------------------------------------------------------------------------


class TestListPrompts:
    """获取提示词模板列表"""

    def test_list_empty(self, test_client):
        """空列表返回 []"""
        headers = _auth_header(test_client)
        resp = test_client.get("/api/v1/prompts/", headers=headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_all(self, test_client):
        """返回用户所有模板"""
        headers = _auth_header(test_client)
        _create_prompt(test_client, headers, name="模板 A")
        _create_prompt(test_client, headers, name="模板 B", analysis_type="keywords")

        resp = test_client.get("/api/v1/prompts/", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        names = [t["name"] for t in data]
        assert "模板 A" in names
        assert "模板 B" in names

    def test_list_filter_by_type(self, test_client):
        """按 analysis_type 筛选"""
        headers = _auth_header(test_client)
        _create_prompt(test_client, headers, name="摘要模板")
        _create_prompt(test_client, headers, name="方法模板", analysis_type="method")
        _create_prompt(test_client, headers, name="结论模板", analysis_type="conclusion")

        resp = test_client.get(
            "/api/v1/prompts/", headers=headers, params={"analysis_type": "method"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "方法模板"

    def test_list_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.get("/api/v1/prompts/")
        assert resp.status_code == 401

    def test_list_user_isolation(self, test_client):
        """不同用户的模板相互隔离"""
        headers_a = _auth_header(test_client, suffix="_a")
        headers_b = _auth_header(test_client, suffix="_b")

        _create_prompt(test_client, headers_a, name="用户A的模板")
        _create_prompt(test_client, headers_b, name="用户B的模板")

        resp_a = test_client.get("/api/v1/prompts/", headers=headers_a)
        assert len(resp_a.json()) == 1
        assert resp_a.json()[0]["name"] == "用户A的模板"

        resp_b = test_client.get("/api/v1/prompts/", headers=headers_b)
        assert len(resp_b.json()) == 1
        assert resp_b.json()[0]["name"] == "用户B的模板"


# ---------------------------------------------------------------------------
# 详情查询
# ---------------------------------------------------------------------------


class TestGetPrompt:
    """获取提示词模板详情"""

    def test_get_success(self, test_client):
        """获取详情成功"""
        headers = _auth_header(test_client)
        create_resp = _create_prompt(test_client, headers)
        prompt_id = create_resp.json()["id"]

        resp = test_client.get(f"/api/v1/prompts/{prompt_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == prompt_id
        assert data["name"] == "默认摘要模板"
        assert data["system_prompt"] == _SAMPLE_SYSTEM_PROMPT

    def test_get_not_found(self, test_client):
        """不存在的模板返回 404"""
        headers = _auth_header(test_client)
        resp = test_client.get("/api/v1/prompts/9999", headers=headers)
        assert resp.status_code == 404
        assert "不存在" in resp.json()["detail"]

    def test_get_other_user(self, test_client):
        """他人的模板返回 404"""
        headers_a = _auth_header(test_client, suffix="_a")
        create_resp = _create_prompt(test_client, headers_a)
        prompt_id = create_resp.json()["id"]

        headers_b = _auth_header(test_client, suffix="_b")
        resp = test_client.get(f"/api/v1/prompts/{prompt_id}", headers=headers_b)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 更新模板
# ---------------------------------------------------------------------------


class TestUpdatePrompt:
    """更新提示词模板"""

    def test_update_success(self, test_client):
        """正常更新"""
        headers = _auth_header(test_client)
        create_resp = _create_prompt(test_client, headers)
        prompt_id = create_resp.json()["id"]

        resp = test_client.put(
            f"/api/v1/prompts/{prompt_id}",
            json={"name": "更新后的名称"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "更新后的名称"

    def test_update_all_fields(self, test_client):
        """更新所有字段"""
        headers = _auth_header(test_client)
        create_resp = _create_prompt(test_client, headers)
        prompt_id = create_resp.json()["id"]

        resp = test_client.put(
            f"/api/v1/prompts/{prompt_id}",
            json={
                "name": "全新模板",
                "description": "新描述",
                "analysis_type": "method",
                "system_prompt": "新的系统提示词",
                "user_prompt_template": "{title}",
                "is_default": True,
            },
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "全新模板"
        assert data["description"] == "新描述"
        assert data["analysis_type"] == "method"
        assert data["system_prompt"] == "新的系统提示词"
        assert data["user_prompt_template"] == "{title}"

    def test_update_duplicate_name(self, test_client):
        """更新到已存在的名称返回 409"""
        headers = _auth_header(test_client)
        _create_prompt(test_client, headers, name="保留名称")
        create_resp = _create_prompt(test_client, headers, name="待更新名称")
        prompt_id = create_resp.json()["id"]

        resp = test_client.put(
            f"/api/v1/prompts/{prompt_id}",
            json={"name": "保留名称"},
            headers=headers,
        )
        assert resp.status_code == 409
        assert "已存在" in resp.json()["detail"]

    def test_update_not_found(self, test_client):
        """不存在的模板返回 404"""
        headers = _auth_header(test_client)
        resp = test_client.put(
            "/api/v1/prompts/9999",
            json={"name": "新名称"},
            headers=headers,
        )
        assert resp.status_code == 404

    def test_update_other_user(self, test_client):
        """更新他人模板返回 404"""
        headers_a = _auth_header(test_client, suffix="_a")
        create_resp = _create_prompt(test_client, headers_a)
        prompt_id = create_resp.json()["id"]

        headers_b = _auth_header(test_client, suffix="_b")
        resp = test_client.put(
            f"/api/v1/prompts/{prompt_id}",
            json={"name": "hack"},
            headers=headers_b,
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 删除模板
# ---------------------------------------------------------------------------


class TestDeletePrompt:
    """删除提示词模板"""

    def test_delete_success(self, test_client):
        """正常删除返回 204"""
        headers = _auth_header(test_client)
        create_resp = _create_prompt(test_client, headers)
        prompt_id = create_resp.json()["id"]

        resp = test_client.delete(f"/api/v1/prompts/{prompt_id}", headers=headers)
        assert resp.status_code == 204

        # 确认已删除
        get_resp = test_client.get(f"/api/v1/prompts/{prompt_id}", headers=headers)
        assert get_resp.status_code == 404

    def test_delete_not_found(self, test_client):
        """不存在的模板返回 404"""
        headers = _auth_header(test_client)
        resp = test_client.delete("/api/v1/prompts/9999", headers=headers)
        assert resp.status_code == 404

    def test_delete_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.delete("/api/v1/prompts/1")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# 设为默认
# ---------------------------------------------------------------------------


class TestSetDefaultPrompt:
    """将模板设为默认"""

    def test_set_default_success(self, test_client):
        """设为默认成功"""
        headers = _auth_header(test_client)
        create_resp = _create_prompt(test_client, headers)
        prompt_id = create_resp.json()["id"]

        resp = test_client.post(
            f"/api/v1/prompts/{prompt_id}/set-default",
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_default"] is True

    def test_set_default_clears_old(self, test_client):
        """设置新默认后，旧默认自动取消"""
        headers = _auth_header(test_client)
        cr1 = _create_prompt(test_client, headers, name="旧默认", is_default=True)
        old_id = cr1.json()["id"]

        cr2 = _create_prompt(test_client, headers, name="新默认")
        new_id = cr2.json()["id"]

        # 将新模板设为默认
        test_client.post(
            f"/api/v1/prompts/{new_id}/set-default",
            headers=headers,
        )

        # 旧默认不再是默认
        old_resp = test_client.get(f"/api/v1/prompts/{old_id}", headers=headers)
        assert old_resp.json()["is_default"] is False

        # 新模板是默认
        new_resp = test_client.get(f"/api/v1/prompts/{new_id}", headers=headers)
        assert new_resp.json()["is_default"] is True

    def test_set_default_not_found(self, test_client):
        """不存在的模板返回 404"""
        headers = _auth_header(test_client)
        resp = test_client.post("/api/v1/prompts/9999/set-default", headers=headers)
        assert resp.status_code == 404

    def test_set_default_other_user(self, test_client):
        """他人模板返回 404"""
        headers_a = _auth_header(test_client, suffix="_a")
        create_resp = _create_prompt(test_client, headers_a)
        prompt_id = create_resp.json()["id"]

        headers_b = _auth_header(test_client, suffix="_b")
        resp = test_client.post(
            f"/api/v1/prompts/{prompt_id}/set-default",
            headers=headers_b,
        )
        assert resp.status_code == 404
