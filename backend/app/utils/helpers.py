import re
from typing import List, Dict, Any

def validate_doi(doi: str) -> bool:
    """验证DOI格式"""
    doi_pattern = r'^10\.\d{4,9}/[-._;()/:A-Z0-9]+$'
    return bool(re.match(doi_pattern, doi, re.IGNORECASE))

def extract_doi_from_text(text: str) -> Optional[str]:
    """从文本中提取DOI"""
    doi_pattern = r'(10\.\d{4,9}/[-._;()/:A-Z0-9]+)'
    match = re.search(doi_pattern, text, re.IGNORECASE)
    return match.group(1) if match else None

def format_paper_title(title: str) -> str:
    """格式化论文标题"""
    # 去除多余空格，首字母大写等
    return ' '.join(word.capitalize() for word in title.split())

def parse_author_string(authors: str) -> List[str]:
    """解析作者字符串"""
    if not authors:
        return []
    # 简单的作者解析逻辑
    return [author.strip() for author in authors.split(',') if author.strip()]