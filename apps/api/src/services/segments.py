import uuid

from fastapi import HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.segment import Segment, SegmentVariant
from src.models.setlist_template import SetlistTemplate
from src.models.show import Show
from src.schemas.segments import CsvImportRow, SegmentCreate, SegmentReorderRequest, SegmentUpdate


class SegmentService:
    BLOCKED_STATUSES = ("live", "ended")

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_segments(self, show_id: uuid.UUID) -> list[Segment]:
        await self._get_show_or_404(show_id)
        stmt = (
            select(Segment)
            .where(Segment.show_id == show_id)
            .options(selectinload(Segment.variants))
            .order_by(Segment.position)
        )
        result = await self.session.execute(stmt)
        return list(result.unique().scalars().all())

    async def create_segment(self, show_id: uuid.UUID, data: SegmentCreate) -> Segment:
        show = await self._get_show_or_404(show_id)
        self._guard_show_not_live(show)

        max_pos = (
            await self.session.execute(
                select(func.coalesce(func.max(Segment.position), 0)).where(
                    Segment.show_id == show_id
                )
            )
        ).scalar_one()

        segment = Segment(
            id=uuid.uuid4(),
            show_id=show_id,
            name=data.name,
            position=max_pos + 1,
            type=data.type,
            bpm=data.bpm,
            genre=data.genre,
            expected_energy=data.expected_energy,
            is_locked=data.is_locked,
            is_skippable=data.is_skippable,
            has_pyro=data.has_pyro,
            notes=data.notes,
        )
        self.session.add(segment)
        await self.session.flush()

        for v in data.variants:
            variant = SegmentVariant(
                id=uuid.uuid4(),
                segment_id=segment.id,
                variant_type=v.variant_type,
                duration_seconds=v.duration_seconds,
                description=v.description,
            )
            self.session.add(variant)

        await self.session.flush()
        return await self._get_segment_or_404(show_id, segment.id)

    async def update_segment(
        self, show_id: uuid.UUID, segment_id: uuid.UUID, data: SegmentUpdate
    ) -> Segment:
        show = await self._get_show_or_404(show_id)
        self._guard_show_not_live(show)
        segment = await self._get_segment_or_404(show_id, segment_id)

        update_data = data.model_dump(exclude_unset=True)

        scalar_fields = (
            "name",
            "type",
            "bpm",
            "genre",
            "expected_energy",
            "is_locked",
            "is_skippable",
            "has_pyro",
            "notes",
        )
        for field in scalar_fields:
            if field in update_data:
                setattr(segment, field, update_data[field])

        if "variants" in update_data:
            # Replace-all: delete old, create new
            for old_v in list(segment.variants):
                await self.session.delete(old_v)
            await self.session.flush()

            for v in data.variants:
                variant = SegmentVariant(
                    id=uuid.uuid4(),
                    segment_id=segment.id,
                    variant_type=v.variant_type,
                    duration_seconds=v.duration_seconds,
                    description=v.description,
                )
                self.session.add(variant)

        await self.session.flush()
        sid = segment.id
        self.session.expire(segment)
        return await self._get_segment_or_404(show_id, sid)

    async def delete_segment(self, show_id: uuid.UUID, segment_id: uuid.UUID) -> None:
        show = await self._get_show_or_404(show_id)
        self._guard_show_not_live(show)
        segment = await self._get_segment_or_404(show_id, segment_id)

        deleted_pos = segment.position
        await self.session.delete(segment)
        await self.session.flush()

        # Rebuild positions
        await self.session.execute(
            update(Segment)
            .where(Segment.show_id == show_id, Segment.position > deleted_pos)
            .values(position=Segment.position - 1)
        )
        await self.session.flush()

    async def reorder_segments(
        self, show_id: uuid.UUID, data: SegmentReorderRequest
    ) -> list[Segment]:
        show = await self._get_show_or_404(show_id)
        self._guard_show_not_live(show)

        # Load existing segments
        stmt = select(Segment).where(Segment.show_id == show_id).order_by(Segment.position)
        result = await self.session.execute(stmt)
        existing = list(result.scalars().all())

        existing_ids = {s.id for s in existing}
        request_ids = set(data.segment_ids)

        if existing_ids != request_ids:
            raise HTTPException(
                status_code=422,
                detail="segment_ids must contain exactly all segment IDs for this show",
            )

        # Check locked segments preserve position
        id_to_segment = {s.id: s for s in existing}
        for new_pos, seg_id in enumerate(data.segment_ids, start=1):
            seg = id_to_segment[seg_id]
            if seg.is_locked and seg.position != new_pos:
                raise HTTPException(
                    status_code=409,
                    detail=f"Locked segment '{seg.name}' cannot be moved"
                    f" from position {seg.position}",
                )

        # Offset trick to avoid UNIQUE constraint violations
        await self.session.execute(
            update(Segment)
            .where(Segment.show_id == show_id)
            .values(position=Segment.position + 1_000_000)
        )
        await self.session.flush()

        # Set final positions
        for new_pos, seg_id in enumerate(data.segment_ids, start=1):
            await self.session.execute(
                update(Segment).where(Segment.id == seg_id).values(position=new_pos)
            )
        await self.session.flush()

        return await self.list_segments(show_id)

    async def load_template(self, show_id: uuid.UUID, template_id: uuid.UUID) -> list[Segment]:
        show = await self._get_show_or_404(show_id)
        self._guard_show_not_live(show)

        # Load template with segments
        stmt = (
            select(SetlistTemplate)
            .where(SetlistTemplate.id == template_id)
            .options(selectinload(SetlistTemplate.segments))
        )
        result = await self.session.execute(stmt)
        template = result.unique().scalar_one_or_none()
        if template is None:
            raise HTTPException(status_code=404, detail="Template not found")

        # Get current max position
        max_pos = (
            await self.session.execute(
                select(func.coalesce(func.max(Segment.position), 0)).where(
                    Segment.show_id == show_id
                )
            )
        ).scalar_one()

        # Create segments from template
        for t_seg in sorted(template.segments, key=lambda s: s.position):
            max_pos += 1
            segment = Segment(
                id=uuid.uuid4(),
                show_id=show_id,
                name=t_seg.name,
                position=max_pos,
                type="song",
                notes=t_seg.note,
            )
            self.session.add(segment)
            await self.session.flush()

            # Full variant
            self.session.add(
                SegmentVariant(
                    id=uuid.uuid4(),
                    segment_id=segment.id,
                    variant_type="full",
                    duration_seconds=t_seg.duration_full,
                )
            )

            # Short variant (optional)
            if t_seg.duration_short is not None:
                self.session.add(
                    SegmentVariant(
                        id=uuid.uuid4(),
                        segment_id=segment.id,
                        variant_type="short",
                        duration_seconds=t_seg.duration_short,
                    )
                )

        await self.session.flush()
        return await self.list_segments(show_id)

    async def import_csv(self, show_id: uuid.UUID, rows: list[CsvImportRow]) -> list[Segment]:
        show = await self._get_show_or_404(show_id)
        self._guard_show_not_live(show)

        # Delete all existing segments (cascade deletes variants)
        await self.session.execute(delete(Segment).where(Segment.show_id == show_id))
        await self.session.flush()

        # Create new segments from rows
        for idx, row in enumerate(rows, start=1):
            segment = Segment(
                id=uuid.uuid4(),
                show_id=show_id,
                name=row.name,
                position=idx,
                type="song",
            )
            self.session.add(segment)
            await self.session.flush()

            self.session.add(
                SegmentVariant(
                    id=uuid.uuid4(),
                    segment_id=segment.id,
                    variant_type="full",
                    duration_seconds=row.duration_full,
                )
            )

            if row.duration_short is not None:
                self.session.add(
                    SegmentVariant(
                        id=uuid.uuid4(),
                        segment_id=segment.id,
                        variant_type="short",
                        duration_seconds=row.duration_short,
                    )
                )

        await self.session.flush()
        return await self.list_segments(show_id)

    # --- Private helpers ---

    async def _get_show_or_404(self, show_id: uuid.UUID) -> Show:
        show = await self.session.get(Show, show_id)
        if show is None:
            raise HTTPException(status_code=404, detail="Show not found")
        return show

    def _guard_show_not_live(self, show: Show) -> None:
        if show.status in self.BLOCKED_STATUSES:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot modify segments when show status is '{show.status}'",
            )

    async def _get_segment_or_404(self, show_id: uuid.UUID, segment_id: uuid.UUID) -> Segment:
        stmt = (
            select(Segment)
            .where(Segment.id == segment_id, Segment.show_id == show_id)
            .options(selectinload(Segment.variants))
        )
        result = await self.session.execute(stmt)
        segment = result.unique().scalar_one_or_none()
        if segment is None:
            raise HTTPException(status_code=404, detail="Segment not found")
        return segment
