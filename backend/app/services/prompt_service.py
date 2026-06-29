"""提示词模板服务层 — CRUD + 默认模板管理"""

import logging

from app.models.ai import AIPromptTemplate
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def create_template(
    db: Session,
    user_id: int,
    name: str,
    analysis_type: str,
    system_prompt: str,
    *,
    description: str | None = None,
    user_prompt_template: str | None = None,
    is_default: bool = False,
) -> AIPromptTemplate:
    """创建提示词模板"""
    # 检查同名模板
    existing = (
        db.query(AIPromptTemplate)
        .filter(AIPromptTemplate.user_id == user_id, AIPromptTemplate.name == name)
        .first()
    )
    if existing:
        raise ValueError(f"模板名称 '{name}' 已存在")

    # 如果设为默认，先清除该类型的旧默认
    if is_default:
        _clear_default_for_type(db, user_id, analysis_type)

    template = AIPromptTemplate(
        user_id=user_id,
        name=name,
        description=description,
        analysis_type=analysis_type,
        system_prompt=system_prompt,
        user_prompt_template=user_prompt_template,
        is_default=is_default,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    logger.info("创建提示词模板: id=%d, name=%s, type=%s", template.id, name, analysis_type)
    return template


def get_templates(
    db: Session, user_id: int, analysis_type: str | None = None
) -> list[AIPromptTemplate]:
    """获取用户的提示词模板列表"""
    query = db.query(AIPromptTemplate).filter(AIPromptTemplate.user_id == user_id)
    if analysis_type:
        query = query.filter(AIPromptTemplate.analysis_type == analysis_type)
    return query.order_by(
        AIPromptTemplate.is_default.desc(), AIPromptTemplate.updated_at.desc()
    ).all()


def get_template(db: Session, template_id: int, user_id: int) -> AIPromptTemplate | None:
    """获取单个模板详情"""
    return (
        db.query(AIPromptTemplate)
        .filter(AIPromptTemplate.id == template_id, AIPromptTemplate.user_id == user_id)
        .first()
    )


def get_default_template(db: Session, user_id: int, analysis_type: str) -> AIPromptTemplate | None:
    """获取指定类型的默认模板"""
    return (
        db.query(AIPromptTemplate)
        .filter(
            AIPromptTemplate.user_id == user_id,
            AIPromptTemplate.analysis_type == analysis_type,
            AIPromptTemplate.is_default,
        )
        .first()
    )


def update_template(
    db: Session,
    template_id: int,
    user_id: int,
    **kwargs,
) -> AIPromptTemplate | None:
    """更新提示词模板"""
    template = get_template(db, template_id, user_id)
    if not template:
        return None

    # 检查重名
    if "name" in kwargs and kwargs["name"]:
        conflict = (
            db.query(AIPromptTemplate)
            .filter(
                AIPromptTemplate.user_id == user_id,
                AIPromptTemplate.name == kwargs["name"],
                AIPromptTemplate.id != template_id,
            )
            .first()
        )
        if conflict:
            raise ValueError(f"模板名称 '{kwargs['name']}' 已存在")

    # 如果设为默认，先清除旧默认
    if kwargs.get("is_default"):
        analysis_type = kwargs.get("analysis_type") or template.analysis_type
        _clear_default_for_type(db, user_id, analysis_type)

    for key, value in kwargs.items():
        if value is not None:
            setattr(template, key, value)

    db.commit()
    db.refresh(template)
    return template


def delete_template(db: Session, template_id: int, user_id: int) -> bool:
    """删除提示词模板"""
    template = get_template(db, template_id, user_id)
    if not template:
        return False
    db.delete(template)
    db.commit()
    return True


def set_default_template(db: Session, template_id: int, user_id: int) -> AIPromptTemplate | None:
    """将模板设为该类型的默认模板"""
    template = get_template(db, template_id, user_id)
    if not template:
        return None

    _clear_default_for_type(db, user_id, template.analysis_type)

    template.is_default = True
    db.commit()
    db.refresh(template)
    return template


def _clear_default_for_type(db: Session, user_id: int, analysis_type: str) -> None:
    """清除指定类型的默认模板标记"""
    prev_default = (
        db.query(AIPromptTemplate)
        .filter(
            AIPromptTemplate.user_id == user_id,
            AIPromptTemplate.analysis_type == analysis_type,
            AIPromptTemplate.is_default,
        )
        .all()
    )
    for t in prev_default:
        t.is_default = False
