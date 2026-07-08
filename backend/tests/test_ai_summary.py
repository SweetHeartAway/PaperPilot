"""AI 分析服务测试 — 单篇分析/批量分析/版本管理/版本对比"""

from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# 辅助函数
# ---------------------------------------------------------------------------

TEST_ABSTRACT = (
    "这是一篇关于机器学习在医学影像分析中应用的研究论文。"
    "我们提出了一种基于深度卷积神经网络的新方法，用于自动检测和分类肺部结节。"
    "实验结果表明，该方法在准确率和召回率方面均优于传统方法。"
)


def _auth_header(test_client: TestClient, suffix: str = "") -> dict:
    """注册并登录，返回 Authorization header"""
    test_client.post(
        "/api/v1/auth/register",
        json={
            "email": f"ai{suffix}@test.com",
            "username": f"aiuser{suffix}",
            "password": "password123",
        },
    )
    resp = test_client.post(
        "/api/v1/auth/login",
        data={"username": f"ai{suffix}@test.com", "password": "password123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_paper(
    test_client: TestClient,
    headers: dict,
    abstract: str = TEST_ABSTRACT,
    title: str = "AI 测试论文",
) -> int:
    """创建一篇有摘要的论文，返回 paper_id"""
    resp = test_client.post(
        "/api/v1/papers/",
        json={
            "title": title,
            "abstract": abstract,
            "authors": "测试作者",
        },
        headers=headers,
    )
    return resp.json()["id"]


def _trigger_analysis(test_client: TestClient, headers: dict, paper_id: int, **kwargs) -> dict:
    """触发 AI 分析并返回响应 JSON"""
    resp = test_client.post(
        f"/api/v1/papers/{paper_id}/ai-summary",
        json=kwargs,
        headers=headers,
    )
    return resp


# ---------------------------------------------------------------------------
# 单篇 AI 分析
# ---------------------------------------------------------------------------


class TestGetAISummary:
    """获取 AI 分析结果"""

    def test_get_summary_not_found(self, test_client):
        """从未触发分析的论文返回 404"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.get(f"/api/v1/papers/{paper_id}/ai-summary", headers=headers)
        assert resp.status_code == 404
        assert "未找到" in resp.json()["detail"]

    def test_get_summary_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.get("/api/v1/papers/1/ai-summary")
        assert resp.status_code == 401

    def test_get_summary_nonexistent_paper(self, test_client):
        """不存在的论文返回 404"""
        headers = _auth_header(test_client)
        resp = test_client.get("/api/v1/papers/99999/ai-summary", headers=headers)
        assert resp.status_code == 404

    def test_get_summary_other_user(self, test_client):
        """他人论文返回 404"""
        headers_a = _auth_header(test_client, suffix="_a")
        paper_id = _create_paper(test_client, headers_a)

        headers_b = _auth_header(test_client, suffix="_b")
        resp = test_client.get(f"/api/v1/papers/{paper_id}/ai-summary", headers=headers_b)
        assert resp.status_code == 404


class TestTriggerAISummary:
    """触发 AI 分析"""

    def test_trigger_summary_success(self, test_client):
        """正常触发 AI 分析返回 completed"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = _trigger_analysis(test_client, headers, paper_id)
        # stub AI 应同步完成
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "completed"
        assert data["paper_id"] == paper_id
        assert data["version"] == 1
        assert data["analysis_type"] == "summary"
        # 结果应包含摘要文本（stub AI 截取内容）
        assert data["result"] is not None
        assert "summary" in data["result"]

    def test_trigger_summary_force_regenerate(self, test_client):
        """force_regenerate=True 生成新版本"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        # 第一次分析
        _trigger_analysis(test_client, headers, paper_id)
        # 强制重新生成
        resp = _trigger_analysis(test_client, headers, paper_id, force_regenerate=True)
        assert resp.status_code == 200
        data = resp.json()
        assert data["version"] == 2  # 版本递增
        assert data["status"] == "completed"

    def test_trigger_summary_returns_cache(self, test_client):
        """非 force 时返回缓存结果"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp1 = _trigger_analysis(test_client, headers, paper_id)
        v1_id = resp1.json()["id"]

        resp2 = _trigger_analysis(test_client, headers, paper_id)
        assert resp2.status_code == 200
        assert resp2.json()["id"] == v1_id  # 同一记录
        assert resp2.json()["version"] == 1

    def test_trigger_summary_nonexistent_paper(self, test_client):
        """不存在的论文返回 404"""
        headers = _auth_header(test_client)
        resp = _trigger_analysis(test_client, headers, 99999)
        assert resp.status_code == 404
        assert "不存在" in resp.json()["detail"]

    def test_trigger_summary_other_user(self, test_client):
        """他人论文返回 404"""
        headers_a = _auth_header(test_client, suffix="_a")
        paper_id = _create_paper(test_client, headers_a)

        headers_b = _auth_header(test_client, suffix="_b")
        resp = _trigger_analysis(test_client, headers_b, paper_id)
        assert resp.status_code == 404

    def test_trigger_summary_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.post("/api/v1/papers/1/ai-summary", json={})
        assert resp.status_code == 401

    def test_trigger_summary_no_abstract_no_pdf(self, test_client):
        """论文无摘要且无 PDF 时返回 400"""
        headers = _auth_header(test_client)
        resp_create = test_client.post(
            "/api/v1/papers/",
            json={"title": "无内容论文"},
            headers=headers,
        )
        paper_id = resp_create.json()["id"]

        resp = _trigger_analysis(test_client, headers, paper_id)
        assert resp.status_code == 400
        assert "没有可分析的内容" in resp.json()["detail"]

    def test_trigger_summary_with_custom_type(self, test_client):
        """指定 analysis_type=method"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = _trigger_analysis(test_client, headers, paper_id, analysis_type="method")
        assert resp.status_code == 200
        data = resp.json()
        assert data["analysis_type"] == "method"
        assert data["status"] == "completed"

    def test_trigger_summary_invalid_type(self, test_client):
        """无效 analysis_type 返回 422"""
        headers = _auth_header(test_client)
        resp = test_client.post(
            "/api/v1/papers/1/ai-summary",
            json={"analysis_type": "invalid_type"},
            headers=headers,
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 版本管理
# ---------------------------------------------------------------------------


class TestAnalysisVersions:
    """AI 分析版本列表"""

    def test_versions_empty(self, test_client):
        """无分析记录时返回 404"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.get(
            f"/api/v1/papers/{paper_id}/ai-summary/versions",
            headers=headers,
        )
        assert resp.status_code == 404
        assert "尚未进行" in resp.json()["detail"]

    def test_versions_list(self, test_client):
        """有版本记录时返回列表"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        # 生成两个版本
        _trigger_analysis(test_client, headers, paper_id)
        _trigger_analysis(test_client, headers, paper_id, force_regenerate=True)

        resp = test_client.get(
            f"/api/v1/papers/{paper_id}/ai-summary/versions",
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        versions = [v["version"] for v in data]
        assert 1 in versions
        assert 2 in versions
        # 版本信息应包含关键字段
        assert "status" in data[0]
        assert "created_at" in data[0]

    def test_versions_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.get("/api/v1/papers/1/ai-summary/versions")
        assert resp.status_code == 401


class TestAnalysisVersionDiff:
    """AI 分析版本对比"""

    def test_diff_success(self, test_client):
        """对比两个版本成功"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        _trigger_analysis(test_client, headers, paper_id)
        _trigger_analysis(test_client, headers, paper_id, force_regenerate=True)

        resp = test_client.get(
            f"/api/v1/papers/{paper_id}/ai-summary/versions/diff",
            params={"v1": 1, "v2": 2},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["version_a"] == 1
        assert data["version_b"] == 2
        assert "summary" in data
        assert "keywords_added" in data
        assert "keywords_removed" in data

    def test_diff_version_not_found(self, test_client):
        """不存在的版本返回 404"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        _trigger_analysis(test_client, headers, paper_id)

        resp = test_client.get(
            f"/api/v1/papers/{paper_id}/ai-summary/versions/diff",
            params={"v1": 1, "v2": 999},
            headers=headers,
        )
        assert resp.status_code == 404

    def test_diff_invalid_params(self, test_client):
        """缺少参数返回 422"""
        headers = _auth_header(test_client)
        paper_id = _create_paper(test_client, headers)

        resp = test_client.get(
            f"/api/v1/papers/{paper_id}/ai-summary/versions/diff",
            params={"v1": 1},
            headers=headers,
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 批量 AI 分析
# ---------------------------------------------------------------------------


class TestBatchAISummary:
    """批量 AI 分析"""

    def test_batch_success(self, test_client):
        """批量分析多篇论文"""
        headers = _auth_header(test_client)
        pid1 = _create_paper(test_client, headers, title="Paper A")
        pid2 = _create_paper(test_client, headers, title="Paper B")

        resp = test_client.post(
            "/api/v1/papers/batch/ai-summary",
            json={"paper_ids": [pid1, pid2]},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["accepted"] == 2
        assert data["skipped"] == 0
        assert len(data["results"]) == 2
        for item in data["results"]:
            assert item["status"] == "accepted"

    def test_batch_with_existing_cache(self, test_client):
        """已有缓存结果时跳过"""
        headers = _auth_header(test_client)
        pid1 = _create_paper(test_client, headers)

        # 先分析一篇
        _trigger_analysis(test_client, headers, pid1)

        # 批量时这篇已有缓存
        pid2 = _create_paper(test_client, headers, title="Paper B")
        resp = test_client.post(
            "/api/v1/papers/batch/ai-summary",
            json={"paper_ids": [pid1, pid2]},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["accepted"] == 1  # 只有 Paper B 被接受
        assert data["skipped"] == 1  # Paper A 跳过

        # 确认跳过的原因是缓存
        skipped = [r for r in data["results"] if r["status"] == "skipped"]
        assert len(skipped) == 1
        assert "缓存" in skipped[0]["reason"]

    def test_batch_with_nonexistent_paper(self, test_client):
        """批量中包含不存在的论文"""
        headers = _auth_header(test_client)
        pid = _create_paper(test_client, headers)

        resp = test_client.post(
            "/api/v1/papers/batch/ai-summary",
            json={"paper_ids": [pid, 99999]},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["accepted"] == 1
        assert data["skipped"] == 1
        skipped = [r for r in data["results"] if r["status"] == "skipped"]
        assert len(skipped) == 1
        assert skipped[0]["paper_id"] == 99999

    def test_batch_force_regenerate(self, test_client):
        """force_regenerate=true 即使有缓存也重新生成"""
        headers = _auth_header(test_client)
        pid = _create_paper(test_client, headers)

        # 先分析一次
        _trigger_analysis(test_client, headers, pid)

        # force 重新生成
        resp = test_client.post(
            "/api/v1/papers/batch/ai-summary",
            json={"paper_ids": [pid], "force_regenerate": True},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["accepted"] == 1

    def test_batch_empty_list(self, test_client):
        """空 paper_ids 返回 422"""
        headers = _auth_header(test_client)
        resp = test_client.post(
            "/api/v1/papers/batch/ai-summary",
            json={"paper_ids": []},
            headers=headers,
        )
        assert resp.status_code == 422

    def test_batch_too_many(self, test_client):
        """超过 50 篇返回 422"""
        headers = _auth_header(test_client)
        resp = test_client.post(
            "/api/v1/papers/batch/ai-summary",
            json={"paper_ids": list(range(51))},
            headers=headers,
        )
        assert resp.status_code == 422

    def test_batch_no_auth(self, test_client):
        """未认证返回 401"""
        resp = test_client.post(
            "/api/v1/papers/batch/ai-summary",
            json={"paper_ids": [1, 2]},
        )
        assert resp.status_code == 401
