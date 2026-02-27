import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.schemas.segments import (
    CsvImportRequest,
    SegmentCreate,
    SegmentReorderRequest,
    SegmentResponse,
    SegmentUpdate,
)
from src.services.segments import SegmentService

router = APIRouter(prefix="/shows/{show_id}/segments", tags=["segments"])


@router.get("", response_model=list[SegmentResponse])
async def list_segments(
    show_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    service = SegmentService(session)
    return await service.list_segments(show_id)


@router.post("", response_model=SegmentResponse, status_code=201)
async def create_segment(
    show_id: uuid.UUID,
    data: SegmentCreate,
    session: AsyncSession = Depends(get_session),
):
    service = SegmentService(session)
    segment = await service.create_segment(show_id, data)
    await session.commit()
    return segment


@router.put("/{segment_id}", response_model=SegmentResponse)
async def update_segment(
    show_id: uuid.UUID,
    segment_id: uuid.UUID,
    data: SegmentUpdate,
    session: AsyncSession = Depends(get_session),
):
    service = SegmentService(session)
    segment = await service.update_segment(show_id, segment_id, data)
    await session.commit()
    return segment


@router.delete("/{segment_id}", status_code=204)
async def delete_segment(
    show_id: uuid.UUID,
    segment_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    service = SegmentService(session)
    await service.delete_segment(show_id, segment_id)
    await session.commit()


@router.post("/reorder", response_model=list[SegmentResponse])
async def reorder_segments(
    show_id: uuid.UUID,
    data: SegmentReorderRequest,
    session: AsyncSession = Depends(get_session),
):
    service = SegmentService(session)
    segments = await service.reorder_segments(show_id, data)
    await session.commit()
    return segments


@router.post("/load-template/{template_id}", response_model=list[SegmentResponse])
async def load_template(
    show_id: uuid.UUID,
    template_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    service = SegmentService(session)
    segments = await service.load_template(show_id, template_id)
    await session.commit()
    return segments


@router.post("/import-csv", response_model=list[SegmentResponse])
async def import_csv(
    show_id: uuid.UUID,
    data: CsvImportRequest,
    session: AsyncSession = Depends(get_session),
):
    service = SegmentService(session)
    segments = await service.import_csv(show_id, data.segments)
    await session.commit()
    return segments
