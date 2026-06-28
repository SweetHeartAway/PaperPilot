"""标签功能测试 — CRUD + 论文标签关联"""

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------

def register_user(test_client: TestClient, suffix: str = "") -> dict:
    """注册用户并返回用户信息"""
    resp = test_client.post("/api/v1/auth/register", json={
        "email": f"tag{suffix}@example.com",
        "username": f"taguser{suffix}",
        "password": "testpass123",
    })
    return resp.json()


def get_token(test_client: TestClient, suffix: str = "") -> str:
    """注册+登录，返回 Bearer token"""
    register_user(test_client, suffix)
    resp = test_client.post("/api/v1/auth/login", data={
        "username": f"tag{suffix}@example.com",
        "password": "testpass123",
    })
    return resp.json()["access_token"]


def auth_header(token: str) -> dict:
    """返回 Authorization 请求头"""
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# 标签 CRUD
# ---------------------------------------------------------------------------

class TestCreateTag:
    """创建标签"""

    def test_create_tag_success(self, test_client):
        """正常创建标签"""
        token = get_token(test_client)
        resp = test_client.post("/api/v1/tags/", json={"name": "机器学习"}, headers=auth_header(token))
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "机器学习"
        assert "id" in data
        assert "created_at" in data

    def test_create_tag_duplicate(self, test_client):
        """重复名称返回 400"""
        token = get_token(test_client)
        test_client.post("/api/v1/tags/", json={"name": "深度学习"}, headers=auth_header(token))
        resp = test_client.post("/api/v1/tags/", json={"name": "深度学习"}, headers=auth_header(token))
        assert resp.status_code == 400
        assert "已存在" in resp.json()["detail"]

    def test_create_tag_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.post("/api/v1/tags/", json={"name": "NLP"})
        assert resp.status_code == 401

    def test_create_tag_trim_whitespace(self, test_client):
        """前后空格自动去除"""
        token = get_token(test_client)
        resp = test_client.post("/api/v1/tags/", json={"name": "  计算机视觉  "}, headers=auth_header(token))
        assert resp.status_code == 201
        assert resp.json()["name"] == "计算机视觉"


class TestListTags:
    """标签列表"""

    def test_list_tags_empty(self, test_client):
        """空列表返回 []"""
        token = get_token(test_client)
        resp = test_client.get("/api/v1/tags/", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_tags(self, test_client):
        """返回所有标签"""
        token = get_token(test_client)
        test_client.post("/api/v1/tags/", json={"name": "ML"}, headers=auth_header(token))
        test_client.post("/api/v1/tags/", json={"name": "DL"}, headers=auth_header(token))
        resp = test_client.get("/api/v1/tags/", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        names = [t["name"] for t in data]
        assert "ML" in names
        assert "DL" in names

    def test_list_tags_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.get("/api/v1/tags/")
        assert resp.status_code == 401


class TestGetTag:
    """标签详情"""

    def test_get_tag_detail(self, test_client):
        """获取标签详情（含 paper_count）"""
        token = get_token(test_client)
        create_resp = test_client.post("/api/v1/tags/", json={"name": "数据挖掘"}, headers=auth_header(token))
        tag_id = create_resp.json()["id"]

        resp = test_client.get(f"/api/v1/tags/{tag_id}", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "数据挖掘"
        assert "paper_count" in data
        assert data["paper_count"] == 0

    def test_get_tag_not_found(self, test_client):
        """不存在的标签返回 404"""
        token = get_token(test_client)
        resp = test_client.get("/api/v1/tags/9999", headers=auth_header(token))
        assert resp.status_code == 404


class TestUpdateTag:
    """更新标签"""

    def test_update_tag_success(self, test_client):
        """正常更新标签名称"""
        token = get_token(test_client)
        create_resp = test_client.post("/api/v1/tags/", json={"name": "AI"}, headers=auth_header(token))
        tag_id = create_resp.json()["id"]

        resp = test_client.put(f"/api/v1/tags/{tag_id}", json={"name": "Artificial Intelligence"}, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Artificial Intelligence"

    def test_update_tag_duplicate(self, test_client):
        """更新到已存在的名称返回 400"""
        token = get_token(test_client)
        test_client.post("/api/v1/tags/", json={"name": "CV"}, headers=auth_header(token))
        create_resp = test_client.post("/api/v1/tags/", json={"name": "NLP"}, headers=auth_header(token))
        tag_id = create_resp.json()["id"]

        resp = test_client.put(f"/api/v1/tags/{tag_id}", json={"name": "CV"}, headers=auth_header(token))
        assert resp.status_code == 400
        assert "已存在" in resp.json()["detail"]

    def test_update_tag_not_found(self, test_client):
        """不存在的标签返回 404"""
        token = get_token(test_client)
        resp = test_client.put("/api/v1/tags/9999", json={"name": "new-name"}, headers=auth_header(token))
        assert resp.status_code == 404


class TestDeleteTag:
    """删除标签"""

    def test_delete_tag_success(self, test_client):
        """正常删除返回 204"""
        token = get_token(test_client)
        create_resp = test_client.post("/api/v1/tags/", json={"name": "to-delete"}, headers=auth_header(token))
        tag_id = create_resp.json()["id"]

        resp = test_client.delete(f"/api/v1/tags/{tag_id}", headers=auth_header(token))
        assert resp.status_code == 204

        # 确认已删除
        get_resp = test_client.get(f"/api/v1/tags/{tag_id}", headers=auth_header(token))
        assert get_resp.status_code == 404

    def test_delete_tag_not_found(self, test_client):
        """不存在的标签返回 404"""
        token = get_token(test_client)
        resp = test_client.delete("/api/v1/tags/9999", headers=auth_header(token))
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 论文-标签关联
# ---------------------------------------------------------------------------

class TestAddTagToPaper:
    """给论文添加标签"""

    def _create_paper(self, test_client, token: str) -> dict:
        """辅助：创建一篇论文并返回响应"""
        resp = test_client.post("/api/v1/papers/", json={
            "title": "测试论文",
        }, headers=auth_header(token))
        return resp.json()

    def test_add_tag_to_paper(self, test_client):
        """给论文添加已有标签"""
        token = get_token(test_client)
        paper = self._create_paper(test_client, token)
        test_client.post("/api/v1/tags/", json={"name": "transformer"}, headers=auth_header(token))

        resp = test_client.post(
            f"/api/v1/papers/{paper['id']}/tags",
            json={"name": "transformer"},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        # Paper 响应中应包含 tags
        data = resp.json()
        assert "tags" in data
        tag_names = [t["name"] for t in data["tags"]]
        assert "transformer" in tag_names

    def test_add_tag_to_paper_auto_create(self, test_client):
        """添加不存在的标签时自动创建"""
        token = get_token(test_client)
        paper = self._create_paper(test_client, token)

        resp = test_client.post(
            f"/api/v1/papers/{paper['id']}/tags",
            json={"name": "auto-created"},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        tag_names = [t["name"] for t in resp.json()["tags"]]
        assert "auto-created" in tag_names

        # 确认标签已在数据库中创建
        tags_resp = test_client.get("/api/v1/tags/", headers=auth_header(token))
        assert any(t["name"] == "auto-created" for t in tags_resp.json())

    def test_add_tag_to_paper_idempotent(self, test_client):
        """重复添加相同标签不报错（幂等）"""
        token = get_token(test_client)
        paper = self._create_paper(test_client, token)

        for _ in range(2):
            resp = test_client.post(
                f"/api/v1/papers/{paper['id']}/tags",
                json={"name": "idempotent"},
                headers=auth_header(token),
            )
            assert resp.status_code == 200

        # tags 列表中只出现一次
        data = test_client.get(f"/api/v1/papers/{paper['id']}", headers=auth_header(token)).json()
        assert len([t for t in data["tags"] if t["name"] == "idempotent"]) == 1

    def test_add_tag_to_paper_not_found(self, test_client):
        """给不存在的论文添加标签返回 404"""
        token = get_token(test_client)
        resp = test_client.post(
            "/api/v1/papers/9999/tags",
            json={"name": "some-tag"},
            headers=auth_header(token),
        )
        assert resp.status_code == 404

    def test_add_tag_no_auth(self, test_client):
        """未认证添加到论文返回 401"""
        resp = test_client.post("/api/v1/papers/1/tags", json={"name": "tag"})
        assert resp.status_code == 401


class TestRemoveTagFromPaper:
    """从论文移除标签"""

    def _create_paper_with_tag(self, test_client, token: str, tag_name: str = "removable") -> tuple:
        """辅助：创建论文并添加标签，返回 (paper_id, tag_id)"""
        paper_resp = test_client.post("/api/v1/papers/", json={"title": "Remove Test"}, headers=auth_header(token))
        paper = paper_resp.json()

        tag_resp = test_client.post("/api/v1/tags/", json={"name": tag_name}, headers=auth_header(token))
        tag_id = tag_resp.json()["id"]

        test_client.post(
            f"/api/v1/papers/{paper['id']}/tags",
            json={"name": tag_name},
            headers=auth_header(token),
        )
        return paper["id"], tag_id

    def test_remove_tag_from_paper(self, test_client):
        """正常移除标签返回 204"""
        token = get_token(test_client)
        paper_id, tag_id = self._create_paper_with_tag(test_client, token)

        resp = test_client.delete(
            f"/api/v1/papers/{paper_id}/tags/{tag_id}",
            headers=auth_header(token),
        )
        assert resp.status_code == 204

        # 确认已移除
        paper_resp = test_client.get(f"/api/v1/papers/{paper_id}", headers=auth_header(token))
        assert len(paper_resp.json()["tags"]) == 0

    def test_remove_tag_not_associated(self, test_client):
        """移除未关联的标签返回 400"""
        token = get_token(test_client)
        paper_id, _ = self._create_paper_with_tag(test_client, token)

        # 创建另一个未关联的标签
        tag_resp = test_client.post("/api/v1/tags/", json={"name": "not-associated"}, headers=auth_header(token))
        other_tag_id = tag_resp.json()["id"]

        resp = test_client.delete(
            f"/api/v1/papers/{paper_id}/tags/{other_tag_id}",
            headers=auth_header(token),
        )
        assert resp.status_code == 400

    def test_remove_tag_paper_not_found(self, test_client):
        """论文不存在返回 404"""
        token = get_token(test_client)
        tag_resp = test_client.post("/api/v1/tags/", json={"name": "orphan"}, headers=auth_header(token))
        tag_id = tag_resp.json()["id"]

        resp = test_client.delete(
            f"/api/v1/papers/9999/tags/{tag_id}",
            headers=auth_header(token),
        )
        assert resp.status_code == 404

    def test_remove_tag_not_found(self, test_client):
        """标签不存在返回 404"""
        token = get_token(test_client)
        paper_resp = test_client.post("/api/v1/papers/", json={"title": "Missing Tag"}, headers=auth_header(token))
        paper_id = paper_resp.json()["id"]

        resp = test_client.delete(
            f"/api/v1/papers/{paper_id}/tags/9999",
            headers=auth_header(token),
        )
        assert resp.status_code == 404


class TestDeleteTagCascades:
    """删除标签时自动解除关联"""

    def test_delete_tag_removes_associations(self, test_client):
        """删除标签后，论文中不再包含该标签"""
        token = get_token(test_client)
        # 创建论文并添加标签
        paper_resp = test_client.post("/api/v1/papers/", json={"title": "Cascade Test"}, headers=auth_header(token))
        paper_id = paper_resp.json()["id"]

        test_client.post(f"/api/v1/papers/{paper_id}/tags", json={"name": "cascade"}, headers=auth_header(token))

        # 获取标签 ID
        tag_resp = test_client.get("/api/v1/tags/", headers=auth_header(token))
        tag_id = tag_resp.json()[0]["id"]

        # 删除标签
        test_client.delete(f"/api/v1/tags/{tag_id}", headers=auth_header(token))

        # 论文中该标签应消失
        paper_resp = test_client.get(f"/api/v1/papers/{paper_id}", headers=auth_header(token))
        assert len(paper_resp.json()["tags"]) == 0
