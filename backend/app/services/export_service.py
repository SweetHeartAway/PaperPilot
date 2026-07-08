"""论文引用导出服务 — 支持 BibTeX 和 RIS 格式"""


def generate_bibtex(paper, paper_url: str = "") -> str:
    """生成 BibTeX 格式引用字符串

    Args:
        paper: Paper ORM 实例，需包含 title, authors, publication_date, doi, abstract 字段
        paper_url: 论文的原始 URL（可选，暂未使用）

    Returns:
        BibTeX 格式的引用文本
    """
    year = paper.publication_date.year if paper.publication_date else ""

    key = f"{paper.id}"

    lines = [f"@article{{{key},"]
    lines.append(f"  author = {{{paper.authors or ''}}},")
    lines.append(f"  title = {{{paper.title}}},")
    lines.append("  journal = {},")
    lines.append(f"  year = {{{year}}},")
    lines.append("  volume = {},")
    lines.append("  number = {},")
    lines.append("  pages = {},")
    if paper.doi:
        lines.append(f"  doi = {{{paper.doi}}},")
        lines.append(f"  url = {{https://doi.org/{paper.doi}}},")
    if paper.abstract:
        lines.append(f"  abstract = {{{paper.abstract}}},")
    lines.append("}")
    return "\n".join(lines) + "\n"


def generate_ris(paper) -> str:
    """生成 RIS 格式引用字符串

    Args:
        paper: Paper ORM 实例，需包含 title, authors, publication_date, doi, abstract 字段

    Returns:
        RIS 格式的引用文本
    """
    lines = ["TY  - JOUR"]
    if paper.authors:
        for author in paper.authors.split(","):
            author_stripped = author.strip()
            if author_stripped:
                lines.append(f"AU  - {author_stripped}")
    year = paper.publication_date.year if paper.publication_date else ""
    lines.append(f"PY  - {year}")
    lines.append(f"TI  - {paper.title}")
    if paper.doi:
        lines.append(f"DO  - {paper.doi}")
        lines.append(f"UR  - https://doi.org/{paper.doi}")
    if paper.abstract:
        lines.append(f"N2  - {paper.abstract}")
    lines.append("ER  - ")
    return "\n".join(lines) + "\n"


def export_paper_citation(paper, fmt: str = "bibtex") -> tuple[str, str, str]:
    """导出论文引用，返回 (文件内容, 文件名, media_type)

    Args:
        paper: Paper ORM 实例
        fmt: 导出格式，'bibtex' 或 'ris'

    Returns:
        (内容, 文件名, Content-Type) 三元组

    Raises:
        ValueError: 不支持的导出格式
    """
    if fmt == "bibtex":
        content = generate_bibtex(paper)
        filename = f"paper-{paper.id}.bib"
        media_type = "text/plain; charset=utf-8"
    elif fmt == "ris":
        content = generate_ris(paper)
        filename = f"paper-{paper.id}.ris"
        media_type = "text/plain; charset=utf-8"
    else:
        raise ValueError(f"不支持的导出格式: {fmt}")
    return content, filename, media_type
