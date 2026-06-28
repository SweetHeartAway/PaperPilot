"""论文管理模块测试（含 PDF 上传/下载/删除）"""

import io
import os
import tempfile
import pytest
from fastapi.testclient import TestClient


# 最小的有效 PDF 文件内容
MINI_PDF = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n"
    b"0000000058 00000 n \n0000000115 00000 n \n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
)


def _auth_header(test_client: TestClient) -> dict:
    """注册并登录，返回 Authorization header"""
    test_client.post("/api/v1/auth/register", json={
        "email": "paper@test.com",
        "username": "paperuser",
        "password": "password123",
    })
    resp = test_client.post("/api/v1/auth/login", data={
        "username": "paper@test.com",
        "password": "password123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_paper(test_client: TestClient, headers: dict) -> int:
    """创建一篇测试论文，返回 paper_id"""
    resp = test_client.post("/api/v1/papers/", json={
        "title": "测试论文",
        "abstract": "摘要内容",
        "authors": "作者",
    }, headers=headers)
    return resp.json()["id"]


class TestPaperUpload:
    """PDF 上传测试"""

    def test_upload_pdf_success(self, test_client):
        """上传 PDF 成功"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/upload",
            files={"file": ("test.pdf", io.BytesIO(MINI_PDF), "application/pdf")},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["file_uuid"] is not None
        assert data["original_filename"] == "test.pdf"
        assert data["file_size"] == len(MINI_PDF)
        assert data["id"] == paper_id

    def test_upload_non_pdf_rejected(self, test_client):
        """上传非 PDF 文件被拒绝"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/upload",
            files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "PDF" in resp.json()["detail"]

    def test_upload_no_auth(self, test_client):
        """未认证上传返回 401"""
        resp = test_client.post(
            "/api/v1/papers/1/upload",
            files={"file": ("test.pdf", io.BytesIO(MINI_PDF), "application/pdf")},
        )
        assert resp.status_code == 401

    def test_upload_nonexistent_paper(self, test_client):
        """上传到不存在的论文返回 404"""
        headers = _auth_header(test_client)
        resp = test_client.post(
            "/api/v1/papers/99999/upload",
            files={"file": ("test.pdf", io.BytesIO(MINI_PDF), "application/pdf")},
            headers=headers,
        )
        assert resp.status_code == 404
        assert "论文不存在" in resp.json()["detail"]

    def test_upload_other_users_paper(self, test_client):
        """上传他人论文返回 404"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        # 用另一个账号尝试上传
        test_client.post("/api/v1/auth/register", json={
            "email": "other@test.com",
            "username": "otheruser",
            "password": "password123",
        })
        resp2 = test_client.post("/api/v1/auth/login", data={
            "username": "other@test.com",
            "password": "password123",
        })
        other_token = resp2.json()["access_token"]
        other_headers = {"Authorization": f"Bearer {other_token}"}

        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/upload",
            files={"file": ("hack.pdf", io.BytesIO(MINI_PDF), "application/pdf")},
            headers=other_headers,
        )
        assert resp.status_code == 404

    def test_upload_replace_existing_file(self, test_client):
        """重新上传覆盖旧文件"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        # 第一次上传
        test_client.post(
            f"/api/v1/papers/{paper_id}/upload",
            files={"file": ("v1.pdf", io.BytesIO(MINI_PDF), "application/pdf")},
            headers=headers,
        )
        old_uuid = test_client.get(f"/api/v1/papers/{paper_id}").json()["file_uuid"]

        # 第二次上传覆盖
        new_content = MINI_PDF + b"x"
        resp = test_client.post(
            f"/api/v1/papers/{paper_id}/upload",
            files={"file": ("v2.pdf", io.BytesIO(new_content), "application/pdf")},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["file_uuid"] != old_uuid  # UUID 变更
        assert data["original_filename"] == "v2.pdf"
        assert data["file_size"] == len(new_content)


class TestPaperDownload:
    """PDF 下载测试"""

    def test_download_success(self, test_client):
        """下载 PDF 成功"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        test_client.post(
            f"/api/v1/papers/{paper_id}/upload",
            files={"file": ("down.pdf", io.BytesIO(MINI_PDF), "application/pdf")},
            headers=headers,
        )

        resp = test_client.get(
            f"/api/v1/papers/{paper_id}/download",
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert resp.content == MINI_PDF

    def test_download_no_file(self, test_client):
        """下载未上传文件的论文返回 404"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.get(
            f"/api/v1/papers/{paper_id}/download",
            headers=headers,
        )
        assert resp.status_code == 404
        assert "文件不存在" in resp.json()["detail"]

    def test_download_nonexistent_paper(self, test_client):
        """下载不存在论文的文件返回 404"""
        headers = _auth_header(test_client)
        resp = test_client.get(
            "/api/v1/papers/99999/download",
            headers=headers,
        )
        assert resp.status_code == 404

    def test_download_no_auth(self, test_client):
        """未认证下载返回 401"""
        resp = test_client.get("/api/v1/papers/1/download")
        assert resp.status_code == 401

    def test_download_other_users_paper(self, test_client):
        """下载他人论文的文件（已上传）"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)
        test_client.post(
            f"/api/v1/papers/{paper_id}/upload",
            files={"file": ("down.pdf", io.BytesIO(MINI_PDF), "application/pdf")},
            headers=headers,
        )
        # 下载不需要所有权，但需要认证
        test_client.post("/api/v1/auth/register", json={
            "email": "other2@test.com",
            "username": "otheruser2",
            "password": "password123",
        })
        resp2 = test_client.post("/api/v1/auth/login", data={
            "username": "other2@test.com",
            "password": "password123",
        })
        other_headers = {"Authorization": f"Bearer {resp2.json()['access_token']}"}

        resp = test_client.get(
            f"/api/v1/papers/{paper_id}/download",
            headers=other_headers,
        )
        assert resp.status_code == 200
        assert resp.content == MINI_PDF


class TestPaperDeleteFile:
    """PDF 删除测试"""

    def test_delete_file_success(self, test_client):
        """删除文件成功"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        test_client.post(
            f"/api/v1/papers/{paper_id}/upload",
            files={"file": ("del.pdf", io.BytesIO(MINI_PDF), "application/pdf")},
            headers=headers,
        )

        resp = test_client.delete(
            f"/api/v1/papers/{paper_id}/file",
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["file_uuid"] is None
        assert data["original_filename"] is None
        assert data["file_size"] is None

        # 确认磁盘文件也被删除
        down = test_client.get(
            f"/api/v1/papers/{paper_id}/download",
            headers=headers,
        )
        assert down.status_code == 404

    def test_delete_file_no_file(self, test_client):
        """删除不存在的文件返回 404"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.delete(
            f"/api/v1/papers/{paper_id}/file",
            headers=headers,
        )
        assert resp.status_code == 404
        assert "文件不存在" in resp.json()["detail"]

    def test_delete_file_twice(self, test_client):
        """重复删除文件返回 404"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        test_client.post(
            f"/api/v1/papers/{paper_id}/upload",
            files={"file": ("twice.pdf", io.BytesIO(MINI_PDF), "application/pdf")},
            headers=headers,
        )
        # 第一次删除
        test_client.delete(f"/api/v1/papers/{paper_id}/file", headers=headers)
        # 第二次删除
        resp = test_client.delete(f"/api/v1/papers/{paper_id}/file", headers=headers)
        assert resp.status_code == 404

    def test_delete_file_other_user(self, test_client):
        """删除他人论文的文件返回 404"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)
        test_client.post(
            f"/api/v1/papers/{paper_id}/upload",
            files={"file": ("otherdel.pdf", io.BytesIO(MINI_PDF), "application/pdf")},
            headers=headers,
        )

        test_client.post("/api/v1/auth/register", json={
            "email": "other3@test.com",
            "username": "otheruser3",
            "password": "password123",
        })
        resp2 = test_client.post("/api/v1/auth/login", data={
            "username": "other3@test.com",
            "password": "password123",
        })
        other_headers = {"Authorization": f"Bearer {resp2.json()['access_token']}"}

        resp = test_client.delete(
            f"/api/v1/papers/{paper_id}/file",
            headers=other_headers,
        )
        assert resp.status_code == 404

    def test_delete_file_no_auth(self, test_client):
        """未认证删除返回 401"""
        resp = test_client.delete("/api/v1/papers/1/file")
        assert resp.status_code == 401

    def test_delete_nonexistent_paper_file(self, test_client):
        """删除不存在论文的文件返回 404"""
        headers = _auth_header(test_client)
        resp = test_client.delete("/api/v1/papers/99999/file", headers=headers)
        assert resp.status_code == 404
