"""提示词模板路由 — CRUD + 设置默认模板"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.ai import (
    PromptTemplateCreate,
    PromptTemplateResponse,
    PromptTemplateUpdate,
)
from app.services import prompt_service

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("/", response_model=list[PromptTemplateResponse])
def list_prompts(
    analysis_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取用户的提示词模板列表（可按分析类型筛选）"""
    return prompt_service.get_templates(db, user_id=current_user.id, analysis_type=analysis_type)


@router.post("/", response_model=PromptTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_prompt(
    request: PromptTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建提示词模板"""
    try:
        return prompt_service.create_template(
            db,
            user_id=current_user.id,
            name=request.name,
            description=request.description,
            analysis_type=request.analysis_type,
            system_prompt=request.system_prompt,
            user_prompt_template=request.user_prompt_template,
            is_default=request.is_default,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("/{template_id}", response_model=PromptTemplateResponse)
def get_prompt(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取提示词模板详情"""
    template = prompt_service.get_template(db, template_id, current_user.id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    return template


@router.put("/{template_id}", response_model=PromptTemplateResponse)
def update_prompt(
    template_id: int,
    request: PromptTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新提示词模板"""
    try:
        template = prompt_service.update_template(
            db,
            template_id,
            current_user.id,
            name=request.name,
            description=request.description,
            analysis_type=request.analysis_type,
            system_prompt=request.system_prompt,
            user_prompt_template=request.user_prompt_template,
            is_default=request.is_default,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prompt(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除提示词模板"""
    success = prompt_service.delete_template(db, template_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    return None


@router.post("/{template_id}/set-default", response_model=PromptTemplateResponse)
def set_default_prompt(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """将模板设为该分析类型的默认模板"""
    template = prompt_service.set_default_template(db, template_id, current_user.id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="模板不存在")
    return template
