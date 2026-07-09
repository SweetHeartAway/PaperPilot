"""DOI 解析服务 — 通过 CrossRef API 自动补全论文元数据"""

import logging
import re
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

CROSSREF_API_BASE = "https://api.crossref.org/works"


def _parse_authors(authors: list[dict]) -> str:
    """将 CrossRef author 列表格式化为 'Last, F., Last2, F.' 字符串"""
    parts = []
    for author in authors:
        given = author.get("given", "")
        family = author.get("family", "")
        if family and given:
            initial = given[0] + "." if given else ""
            parts.append(f"{family}, {initial}")
        elif family:
            parts.append(family)
        elif given:
            parts.append(given)
    return ", ".join(parts)


def _parse_date(message: dict) -> datetime | None:
    """从 CrossRef 消息中提取出版日期"""
    for key in ("published-print", "published-online", "published", "created"):
        date_info = message.get(key)
        if date_info and "date-parts" in date_info and date_info["date-parts"]:
            parts = date_info["date-parts"][0]
            if len(parts) >= 3:
                return datetime(parts[0], parts[1], parts[2])
            if len(parts) >= 2:
                return datetime(parts[0], parts[1], 1)
            if len(parts) >= 1:
                return datetime(parts[0], 1, 1)
    return None


def _clean_abstract(abstract: str) -> str:
    """清理摘要中的 HTML 标签"""
    if not abstract:
        return ""
    return re.sub(r"<[^>]+>", "", abstract).strip()


def lookup_doi(doi: str) -> dict:
    """通过 CrossRef API 查询 DOI 并返回论文元数据

    返回 dict:
        title: str
        authors: str (formatted)
        abstract: str | None
        publication_date: datetime | None

    抛出:
        ValueError: DOI 格式无效或查询失败
    """
    doi = doi.strip()
    if not doi:
        raise ValueError("DOI 不能为空")

    # 去除可能的 URL 前缀
    doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi, flags=re.IGNORECASE)

    url = f"{CROSSREF_API_BASE}/{doi}"
    headers = {
        "User-Agent": "PaperPilot/1.0 (mailto:paperpilot@example.com)",
        "Accept": "application/json",
    }

    logger.info("CrossRef 查询 DOI: %s", doi)

    try:
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise ValueError(f"DOI '{doi}' 未找到")
        raise ValueError(f"CrossRef 查询失败: {e.response.status_code}")
    except httpx.TimeoutException:
        raise ValueError("CrossRef 查询超时，请稍后重试")
    except httpx.HTTPError as e:
        raise ValueError(f"CrossRef 查询失败: {str(e)}")

    message = data.get("message", {})

    # 提取标题
    title_list = message.get("title", [])
    title = title_list[0] if title_list else ""

    # 提取作者
    authors = _parse_authors(message.get("author", []))

    # 提取摘要
    abstract = _clean_abstract(message.get("abstract", ""))

    # 提取出版日期
    publication_date = _parse_date(message)

    result = {
        "title": title,
        "authors": authors,
        "abstract": abstract or None,
        "publication_date": publication_date,
    }

    logger.info("DOI 解析成功: %s -> %s", doi, title)
    return result
