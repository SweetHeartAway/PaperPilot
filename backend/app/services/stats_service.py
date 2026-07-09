"""统计服务 — 论文/标签/AI 分析聚合统计"""

from datetime import datetime, timedelta

from app.models.ai import AIAnalysis
from app.models.paper import Paper
from app.models.tag import Tag, paper_tags
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session


def get_paper_stats(db: Session, user_id: int) -> dict:
    """获取用户论文库统计概览"""

    # ─── 论文统计 ───
    total_papers = db.query(sa_func.count(Paper.id)).filter(Paper.user_id == user_id).scalar() or 0
    favorited_papers = (
        db.query(sa_func.count(Paper.id))
        .filter(Paper.user_id == user_id, Paper.is_favorite)
        .scalar()
        or 0
    )
    papers_with_files = (
        db.query(sa_func.count(Paper.id))
        .filter(Paper.user_id == user_id, Paper.file_uuid.isnot(None))
        .scalar()
        or 0
    )
    avg_file_size = (
        db.query(sa_func.avg(Paper.file_size))
        .filter(Paper.user_id == user_id, Paper.file_size.isnot(None))
        .scalar()
    )

    # ─── 标签分布 ───
    # 使用关联表统计每个标签在当前用户论文中的使用次数
    tag_rows = (
        db.query(Tag.id, Tag.name, sa_func.count(paper_tags.c.paper_id).label("paper_count"))
        .join(paper_tags, Tag.id == paper_tags.c.tag_id)
        .join(Paper, Paper.id == paper_tags.c.paper_id)
        .filter(Paper.user_id == user_id)
        .group_by(Tag.id, Tag.name)
        .order_by(sa_func.count(paper_tags.c.paper_id).desc())
        .all()
    )
    tag_distribution = [
        {"id": row.id, "name": row.name, "paper_count": row.paper_count} for row in tag_rows
    ]
    total_tags = len(tag_distribution)

    # ─── AI 分析统计 ───
    ai_stats = (
        db.query(
            sa_func.count(AIAnalysis.id).label("total"),
            sa_func.sum(AIAnalysis.tokens_used).label("total_tokens"),
        )
        .join(Paper, AIAnalysis.paper_id == Paper.id)
        .filter(Paper.user_id == user_id)
        .first()
    )
    ai_total = ai_stats.total or 0
    ai_total_tokens = ai_stats.total_tokens or 0

    ai_completed = (
        db.query(sa_func.count(AIAnalysis.id))
        .join(Paper, AIAnalysis.paper_id == Paper.id)
        .filter(Paper.user_id == user_id, AIAnalysis.status == "completed")
        .scalar()
        or 0
    )
    ai_failed = (
        db.query(sa_func.count(AIAnalysis.id))
        .join(Paper, AIAnalysis.paper_id == Paper.id)
        .filter(Paper.user_id == user_id, AIAnalysis.status == "failed")
        .scalar()
        or 0
    )

    # ─── 月度新增论文（最近 12 个月） ───
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    monthly_rows = (
        db.query(
            sa_func.strftime("%Y-%m", Paper.created_at).label("month"),
            sa_func.count(Paper.id).label("count"),
        )
        .filter(Paper.user_id == user_id, Paper.created_at >= twelve_months_ago)
        .group_by(sa_func.strftime("%Y-%m", Paper.created_at))
        .order_by(sa_func.strftime("%Y-%m", Paper.created_at))
        .all()
    )
    papers_by_month = [{"month": row.month, "count": row.count} for row in monthly_rows]

    return {
        "total_papers": total_papers,
        "favorited_papers": favorited_papers,
        "total_tags": total_tags,
        "papers_with_files": papers_with_files,
        "average_file_size": round(avg_file_size, 1) if avg_file_size else None,
        "tag_distribution": tag_distribution,
        "ai_analysis": {
            "total": ai_total,
            "completed": ai_completed,
            "failed": ai_failed,
            "total_tokens": ai_total_tokens,
        },
        "papers_by_month": papers_by_month,
    }
