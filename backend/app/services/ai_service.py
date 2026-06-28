"""AI分析服务 — 论文内容分析、摘要生成、关键词提取、论文推荐"""

import re
import json
from typing import Dict, Any, List
from collections import Counter


# 中文停用词（基础版本）
_STOP_WORDS: set[str] = {
    "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都",
    "一", "一个", "上", "也", "很", "到", "说", "要", "去", "你",
    "会", "着", "没有", "看", "好", "自己", "这", "他", "她", "它",
    "们", "那", "这个", "那个", "什么", "怎么", "如何", "因为", "所以",
    "但是", "可以", "我们", "他们", "她们", "它们", "或者", "如果",
    "虽然", "然而", "而且", "并且", "因此", "以及", "对于", "关于",
    "其中", "之后", "之后", "同时", "等", "中", "与", "其", "之",
    "以", "被", "把", "从", "对", "将", "而", "或", "及", "等",
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can",
    "in", "on", "at", "to", "for", "of", "by", "with", "from",
    "and", "or", "but", "not", "this", "that", "these", "those",
    "it", "its", "they", "them", "their", "we", "us", "our",
}


def _split_words(text: str) -> list[str]:
    """将文本分词（支持中英文混合文本）"""
    # 匹配中文字符序列或英文字母序列
    tokens = re.findall(r'[一-鿿]+|[a-zA-Z]+', text.lower())
    return [t for t in tokens if len(t) > 1 and t not in _STOP_WORDS]


def generate_summary(content: str) -> str:
    """生成论文摘要（截取前200个字符作为简单摘要）"""
    cleaned = content.strip()
    if not cleaned:
        return ""
    # 取前 200 个字符作为摘要
    summary = cleaned[:200]
    if len(cleaned) > 200:
        summary += "..."
    return summary


def extract_keywords(content: str) -> List[str]:
    """提取关键词（基于词频取前5个高频词）"""
    words = _split_words(content)
    if not words:
        return []
    counter = Counter(words)
    # 返回前 5 个高频词
    return [word for word, _ in counter.most_common(5)]


def recommend_papers(content: str) -> List[Dict[str, str]]:
    """推荐相关论文（需要接入 AI 服务后实现）"""
    # TODO: 需要接入 AI 推荐服务后实现真实推荐逻辑
    return []


def analyze_paper(content: str) -> Dict[str, Any]:
    """分析论文内容（组合摘要、关键词、推荐结果）"""
    analysis_result = {
        "summary": generate_summary(content),
        "keywords": extract_keywords(content),
        "main_points": [],
        "recommendations": recommend_papers(content),
    }

    return {
        "analysis_id": 1,
        "analysis_type": "full_analysis",
        "result": json.dumps(analysis_result, ensure_ascii=False),
        "created_at": "2023-01-01T00:00:00",
    }
