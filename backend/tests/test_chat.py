"""Paper Chat 测试 — 基于 RAG 的论文对话"""

from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------


def _auth_header(test_client: TestClient, suffix: str = "") -> dict:
    """注册并登录，返回 Authorization header"""
    test_client.post(
        "/api/v1/auth/register",
        json={
            "email": f"chat{suffix}@test.com",
            "username": f"chatuser{suffix}",
            "password": "password123",
        },
    )
    resp = test_client.post(
        "/api/v1/auth/login",
        data={"username": f"chat{suffix}@test.com", "password": "password123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_paper(
    test_client: TestClient,
    headers: dict,
    abstract: str = "这是一篇关于深度学习的论文，研究了 Transformer 架构在自然语言处理中的应用。",
) -> int:
    """创建一篇论文，返回 paper_id"""
    resp = test_client.post(
        "/api/v1/papers/",
        json={
            "title": "Chat 测试论文",
            "abstract": abstract,
            "authors": "Chat作者",
        },
        headers=headers,
    )
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# Chat 测试
# ---------------------------------------------------------------------------


class TestChatWithPaper:
    """论文对话测试"""

    def test_chat_success(self, test_client):
        """正常对话返回答案"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/chat",
            json={"question": "这篇论文讲了什么？"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "answer" in data
        assert data["answer"]  # 答案不为空
        assert "sources" in data  # sources 字段始终存在

    def test_chat_with_history(self, test_client):
        """携带对话历史"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/chat",
            json={
                "question": "详细介绍一下方法？",
                "history": [
                    {"role": "user", "content": "这篇论文讲了什么？"},
                    {"role": "assistant", "content": "这是一篇关于深度学习的论文。"},
                ],
            },
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "answer" in data

    def test_chat_empty_question(self, test_client):
        """空问题返回 422"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/chat",
            json={"question": ""},
            headers=headers,
        )
        assert resp.status_code == 422

    def test_chat_question_too_long(self, test_client):
        """问题超过 2000 字符返回 422"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/chat",
            json={"question": "x" * 2001},
            headers=headers,
        )
        assert resp.status_code == 422

    def test_chat_invalid_role(self, test_client):
        """history 中 invalid role 返回 422"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/chat",
            json={
                "question": "test",
                "history": [{"role": "system", "content": "hello"}],
            },
            headers=headers,
        )
        assert resp.status_code == 422

    def test_chat_nonexistent_paper(self, test_client):
        """不存在的论文返回 404"""
        headers = _auth_header(test_client)
        resp = test_client.post(
            "/api/v1/papers/99999/chat",
            json={"question": "test"},
            headers=headers,
        )
        assert resp.status_code == 404
        assert "不存在" in resp.json()["detail"]

    def test_chat_other_user(self, test_client):
        """他人论文返回 404"""
        headers_a = _auth_header(test_client, suffix="_a")
        paper_id = _create_paper(test_client, headers_a)

        headers_b = _auth_header(test_client, suffix="_b")
        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/chat",
            json={"question": "test"},
            headers=headers_b,
        )
        assert resp.status_code == 404

    def test_chat_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.post(
            "/api/v1/papers/1/chat",
            json={"question": "test"},
        )
        assert resp.status_code == 401

    def test_chat_with_top_k(self, test_client):
        """自定义 top_k 参数"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/chat",
            json={"question": "test", "top_k": 3},
            headers=headers,
        )
        assert resp.status_code == 200

    def test_chat_invalid_top_k_zero(self, test_client):
        """top_k = 0 返回 422"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/chat",
            json={"question": "test", "top_k": 0},
            headers=headers,
        )
        assert resp.status_code == 422

    def test_chat_top_k_too_large(self, test_client):
        """top_k > 20 返回 422"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/chat",
            json={"question": "test", "top_k": 21},
            headers=headers,
        )
        assert resp.status_code == 422
