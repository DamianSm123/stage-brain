import math
import uuid
from typing import Literal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.setlist_template import SetlistTemplate, TemplateSegment
from src.schemas.common import PaginatedResponse
from src.schemas.templates import (
    TemplateCreate,
    TemplateListResponse,
    TemplateUpdate,
)


class TemplateService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_templates(
        self,
        search: str | None = None,
        sort: str = "created_at",
        order: Literal["asc", "desc"] = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedResponse[TemplateListResponse]:
        base = select(SetlistTemplate)
        if search:
            base = base.where(SetlistTemplate.name.ilike(f"%{search}%"))

        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        allowed_sorts = {
            "name": SetlistTemplate.name,
            "created_at": SetlistTemplate.created_at,
            "updated_at": SetlistTemplate.updated_at,
        }
        sort_col = allowed_sorts.get(sort, SetlistTemplate.created_at)
        order_col = sort_col.desc() if order == "desc" else sort_col.asc()

        stmt = (
            base.options(selectinload(SetlistTemplate.segments))
            .order_by(order_col)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.session.execute(stmt)
        templates = result.unique().scalars().all()

        items = [
            TemplateListResponse(
                id=t.id,
                name=t.name,
                note=t.note,
                total_duration_full=t.total_duration_full,
                total_duration_short=t.total_duration_short,
                segment_count=len(t.segments),
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in templates
        ]

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=math.ceil(total / page_size) if page_size > 0 else 0,
        )

    async def get_template(self, template_id: uuid.UUID) -> SetlistTemplate:
        stmt = (
            select(SetlistTemplate)
            .where(SetlistTemplate.id == template_id)
            .options(selectinload(SetlistTemplate.segments))
        )
        result = await self.session.execute(stmt)
        template = result.unique().scalar_one_or_none()
        if template is None:
            raise HTTPException(status_code=404, detail="Template not found")
        return template

    async def create_template(self, data: TemplateCreate) -> SetlistTemplate:
        total_full = sum(s.duration_full for s in data.segments)
        total_short = sum(s.duration_short or 0 for s in data.segments)

        template = SetlistTemplate(
            id=uuid.uuid4(),
            name=data.name,
            note=data.note,
            total_duration_full=total_full,
            total_duration_short=total_short,
        )
        self.session.add(template)
        await self.session.flush()

        for seg_data in data.segments:
            seg = TemplateSegment(
                id=uuid.uuid4(),
                template_id=template.id,
                name=seg_data.name,
                position=seg_data.position,
                duration_full=seg_data.duration_full,
                duration_short=seg_data.duration_short,
                note=seg_data.note,
            )
            self.session.add(seg)

        await self.session.flush()
        return await self.get_template(template.id)

    async def update_template(
        self, template_id: uuid.UUID, data: TemplateUpdate
    ) -> SetlistTemplate:
        template = await self.get_template(template_id)

        update_data = data.model_dump(exclude_unset=True)

        if "name" in update_data:
            template.name = update_data["name"]
        if "note" in update_data:
            template.note = update_data["note"]

        if "segments" in update_data:
            # Replace-all: delete old segments, create new
            for old_seg in list(template.segments):
                await self.session.delete(old_seg)
            await self.session.flush()

            for seg_data in data.segments:
                seg = TemplateSegment(
                    id=uuid.uuid4(),
                    template_id=template.id,
                    name=seg_data.name,
                    position=seg_data.position,
                    duration_full=seg_data.duration_full,
                    duration_short=seg_data.duration_short,
                    note=seg_data.note,
                )
                self.session.add(seg)

            template.total_duration_full = sum(s.duration_full for s in data.segments)
            template.total_duration_short = sum(s.duration_short or 0 for s in data.segments)

        await self.session.flush()
        tid = template.id
        self.session.expire(template)
        return await self.get_template(tid)

    async def delete_template(self, template_id: uuid.UUID) -> None:
        template = await self.get_template(template_id)
        await self.session.delete(template)
        await self.session.flush()
