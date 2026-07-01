"""论文路由 — CRUD、PDF 上传/下载/删除、AI Summary、版本对比、批量分析"""

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.ai import (
    AIAnalysisStatusResponse,
    AIAnalysisTriggerRequest,
    AnalysisVersionItem,
    BatchAnalysisItem,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
    VersionDiffResponse,
)
from app.schemas.paper import Paper, PaperCreate, PaperListResponse, PaperUpdate
from app.schemas.tag import TagName
from app.services import tag_service
from app.services.ai_summary_service import (
    diff_versions,
    get_ai_summary,
    get_analysis_versions,
    trigger_ai_summary,
    trigger_batch_analysis,
)
from app.services.file_service import delete_paper_file, download_paper_file, upload_paper_file
from app.services.paper_service import (
    create_paper,
    delete_paper,
    get_paper,
    get_papers,
    update_paper,
)

router = APIRouter()


@router.post("/", response_model=Paper, status_code=status.HTTP_201_CREATED)
def create_new_paper(
    paper: PaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """创建新论文"""
    try:
        return create_paper(db=db, paper=paper, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=PaperListResponse)
def read_papers(
    skip: int = 0,
    limit: int = 100,
    search: str | None = Query(None, description="搜索关键词（标题/作者/摘要/DOI）"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取论文列表（支持搜索和分页）"""
    papers, total = get_papers(db, user_id=current_user.id, skip=skip, limit=limit, search=search)
    return PaperListResponse(items=papers, total=total)


@router.get("/{paper_id}", response_model=Paper)
def read_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取论文详情"""
    db_paper = get_paper(db, paper_id=paper_id, user_id=current_user.id)
    if db_paper is None:
        raise HTTPException(status_code=404, detail="论文不存在")
    return db_paper


@router.put("/{paper_id}", response_model=Paper)
def update_existing_paper(
    paper_id: int,
    paper: PaperUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新论文"""
    try:
        db_paper = update_paper(db, paper_id=paper_id, paper=paper, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if db_paper is None:
        raise HTTPException(status_code=404, detail="论文不存在")
    return db_paper


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除论文（含文件）"""
    success = delete_paper(db, paper_id=paper_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="论文不存在")
    return None


@router.post("/{paper_id}/upload", response_model=Paper)
def upload_file(
    paper_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """上传论文 PDF 文件"""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="仅支持 PDF 文件")

    try:
        result = upload_paper_file(db, paper_id, current_user.id, file)
        return result
    except ValueError as e:
        detail = str(e)
        status_code = 400 if "文件过大" in detail else 404
        raise HTTPException(status_code=status_code, detail=detail)


@router.get("/{paper_id}/download")
def download_file(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """下载论文 PDF 文件"""
    file_path, filename = download_paper_file(db, paper_id, current_user.id)
    if not file_path:
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(path=file_path, filename=filename, media_type="application/pdf")


@router.delete("/{paper_id}/file", response_model=Paper)
def delete_file(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """删除论文上传的文件"""
    success = delete_paper_file(db, paper_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="文件不存在")
    db_paper = get_paper(db, paper_id=paper_id, user_id=current_user.id)
    return db_paper


@router.post("/{paper_id}/tags", response_model=Paper)
def add_tag_to_paper(
    paper_id: int,
    tag_data: TagName,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """给论文添加标签（如标签不存在则自动创建）"""
    try:
        paper = tag_service.add_tag_to_paper(
            db, paper_id=paper_id, tag_name=tag_data.name, user_id=current_user.id
        )
        return paper
    except ValueError as e:
        detail = str(e)
        status_code = (
            status.HTTP_404_NOT_FOUND if "不存在" in detail else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/{paper_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag_from_paper(
    paper_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """从论文移除标签"""
    try:
        tag_service.remove_tag_from_paper(
            db, paper_id=paper_id, tag_id=tag_id, user_id=current_user.id
        )
    except ValueError as e:
        detail = str(e)
        status_code = status.HTTP_400_BAD_REQUEST
        if "不存在" in detail:
            status_code = status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=status_code, detail=detail)
    return None


# ─── AI Summary — 批量分析 ──────────────────────────────────


@router.post("/batch/ai-summary", response_model=BatchAnalysisResponse)
def batch_ai_summary(
    request: BatchAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """批量触发多篇论文的 AI 分析

    跳过已有 pending/processing 或有缓存结果的论文（不报错）。
    最多支持 50 篇论文一次提交。
    """
    results, accepted, skipped = trigger_batch_analysis(
        db,
        user_id=current_user.id,
        paper_ids=request.paper_ids,
        analysis_type=request.analysis_type,
        force_regenerate=request.force_regenerate,
        custom_prompt_id=request.custom_prompt_id,
    )
    return BatchAnalysisResponse(
        total=len(request.paper_ids),
        accepted=accepted,
        skipped=skipped,
        results=[BatchAnalysisItem(**r) for r in results],
    )


# ─── AI Summary — 单篇 ──────────────────────────────────────


@router.get("/{paper_id}/ai-summary", response_model=AIAnalysisStatusResponse)
def read_ai_summary(
    paper_id: int,
    version: int | None = Query(None, description="指定版本号，默认返回最新 completed 版本"),
    analysis_type: str | None = Query(
        None, description="分析类型（summary/method/result/conclusion）"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取论文的 AI 分析结果

    - 不传 version：返回最新 completed 版本
    - 传 version：返回指定版本（不限状态）
    - 不传 analysis_type：返回 summary 类型结果
    """
    analysis = get_ai_summary(
        db,
        paper_id=paper_id,
        user_id=current_user.id,
        version=version,
        analysis_type=analysis_type or "summary",
    )
    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到对应的 AI 分析结果",
        )
    return analysis


@router.post("/{paper_id}/ai-summary", response_model=AIAnalysisStatusResponse)
def create_ai_summary(
    paper_id: int,
    request: AIAnalysisTriggerRequest = AIAnalysisTriggerRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """触发论文 AI 分析（首次生成或强制重新生成）

    支持 custom_prompt_id 参数使用自定义提示词模板。
    """
    try:
        return trigger_ai_summary(
            db,
            paper_id=paper_id,
            user_id=current_user.id,
            analysis_type=request.analysis_type,
            force_regenerate=request.force_regenerate,
            custom_prompt_id=request.custom_prompt_id,
        )
    except ValueError as e:
        detail = str(e)
        if "不存在" in detail:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
        if "正在分析" in detail:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


# ─── AI Summary — 版本管理 ──────────────────────────────────


@router.get("/{paper_id}/ai-summary/versions", response_model=list[AnalysisVersionItem])
def list_analysis_versions(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取论文 AI 分析的所有版本列表"""
    versions = get_analysis_versions(db, paper_id, user_id=current_user.id)
    if not versions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="该论文尚未进行 AI 分析",
        )
    return versions


@router.get("/{paper_id}/ai-summary/versions/diff", response_model=VersionDiffResponse)
def diff_analysis_versions(
    paper_id: int,
    v1: int = Query(..., description="旧版本号"),
    v2: int = Query(..., description="新版本号"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """对比论文 AI 分析的两个版本"""
    result = diff_versions(db, paper_id=paper_id, user_id=current_user.id, v1=v1, v2=v2)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="版本不存在或不属于当前用户",
        )
    return result
