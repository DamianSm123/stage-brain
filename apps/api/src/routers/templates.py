import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.schemas.common import PaginatedResponse
from src.schemas.templates import (
    TemplateCreate,
    TemplateDetailResponse,
    TemplateListResponse,
    TemplateUpdate,
)
from src.services.templates import TemplateService

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=PaginatedResponse[TemplateListResponse])
async def list_templates(
    search: str | None = Query(default=None),
    sort: str = Query(default="created_at"),
    order: Literal["asc", "desc"] = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    service = TemplateService(session)
    return await service.list_templates(
        search=search, sort=sort, order=order, page=page, page_size=page_size
    )


@router.post("", response_model=TemplateDetailResponse, status_code=201)
async def create_template(
    data: TemplateCreate,
    session: AsyncSession = Depends(get_session),
):
    service = TemplateService(session)
    template = await service.create_template(data)
    await session.commit()
    return template


@router.get("/{template_id}", response_model=TemplateDetailResponse)
async def get_template(
    template_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    service = TemplateService(session)
    return await service.get_template(template_id)


@router.put("/{template_id}", response_model=TemplateDetailResponse)
async def update_template(
    template_id: uuid.UUID,
    data: TemplateUpdate,
    session: AsyncSession = Depends(get_session),
):
    service = TemplateService(session)
    template = await service.update_template(template_id, data)
    await session.commit()
    return template


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    service = TemplateService(session)
    await service.delete_template(template_id)
    await session.commit()
