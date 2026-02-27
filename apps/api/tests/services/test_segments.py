import uuid

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.segment import Segment, SegmentVariant
from src.models.setlist_template import SetlistTemplate, TemplateSegment
from src.models.show import Show
from src.schemas.segments import (
    CsvImportRow,
    SegmentCreate,
    SegmentReorderRequest,
    SegmentUpdate,
    SegmentVariantCreate,
)
from src.services.segments import SegmentService


async def _create_show(
    session: AsyncSession,
    *,
    status: str = "draft",
    name: str = "Test Show",
) -> Show:
    show = Show(name=name, status=status)
    session.add(show)
    await session.flush()
    return show


async def _add_segment(
    session: AsyncSession,
    show: Show,
    position: int,
    *,
    name: str | None = None,
    is_locked: bool = False,
) -> Segment:
    segment = Segment(
        show_id=show.id,
        name=name or f"Song {position}",
        position=position,
        type="song",
        is_locked=is_locked,
    )
    session.add(segment)
    await session.flush()
    return segment


async def _add_variant(
    session: AsyncSession,
    segment: Segment,
    variant_type: str = "full",
    duration: int = 240,
) -> SegmentVariant:
    variant = SegmentVariant(
        segment_id=segment.id,
        variant_type=variant_type,
        duration_seconds=duration,
    )
    session.add(variant)
    await session.flush()
    return variant


async def _create_template(
    session: AsyncSession,
    *,
    name: str = "Template",
    segments: list[dict] | None = None,
) -> SetlistTemplate:
    template = SetlistTemplate(name=name, total_duration_full=0, total_duration_short=0)
    session.add(template)
    await session.flush()

    if segments:
        for seg_data in segments:
            seg = TemplateSegment(
                template_id=template.id,
                name=seg_data["name"],
                position=seg_data["position"],
                duration_full=seg_data["duration_full"],
                duration_short=seg_data.get("duration_short"),
                note=seg_data.get("note"),
            )
            session.add(seg)
        template.total_duration_full = sum(s["duration_full"] for s in segments)
        template.total_duration_short = sum(s.get("duration_short") or 0 for s in segments)
    await session.flush()
    return template


# --- list_segments ---


async def test_list_segments_empty(db_session: AsyncSession):
    show = await _create_show(db_session)
    service = SegmentService(db_session)
    result = await service.list_segments(show.id)
    assert result == []


async def test_list_segments_ordered(db_session: AsyncSession):
    show = await _create_show(db_session)
    await _add_segment(db_session, show, 2, name="Second")
    await _add_segment(db_session, show, 1, name="First")

    service = SegmentService(db_session)
    result = await service.list_segments(show.id)
    assert len(result) == 2
    assert result[0].name == "First"
    assert result[1].name == "Second"


async def test_list_segments_show_not_found(db_session: AsyncSession):
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.list_segments(uuid.uuid4())
    assert exc.value.status_code == 404


# --- create_segment ---


async def test_create_segment_auto_position(db_session: AsyncSession):
    show = await _create_show(db_session)
    service = SegmentService(db_session)

    seg1 = await service.create_segment(show.id, SegmentCreate(name="Song A"))
    assert seg1.position == 1

    seg2 = await service.create_segment(show.id, SegmentCreate(name="Song B"))
    assert seg2.position == 2


async def test_create_segment_with_variants(db_session: AsyncSession):
    show = await _create_show(db_session)
    service = SegmentService(db_session)

    data = SegmentCreate(
        name="With Variants",
        variants=[
            SegmentVariantCreate(variant_type="full", duration_seconds=300),
            SegmentVariantCreate(variant_type="short", duration_seconds=180),
        ],
    )
    seg = await service.create_segment(show.id, data)
    assert len(seg.variants) == 2
    variant_types = {v.variant_type for v in seg.variants}
    assert variant_types == {"full", "short"}


async def test_create_segment_show_live_blocked(db_session: AsyncSession):
    show = await _create_show(db_session, status="live")
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.create_segment(show.id, SegmentCreate(name="Blocked"))
    assert exc.value.status_code == 409


async def test_create_segment_show_ended_blocked(db_session: AsyncSession):
    show = await _create_show(db_session, status="ended")
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.create_segment(show.id, SegmentCreate(name="Blocked"))
    assert exc.value.status_code == 409


# --- update_segment ---


async def test_update_segment_scalar_fields(db_session: AsyncSession):
    show = await _create_show(db_session)
    seg = await _add_segment(db_session, show, 1)
    service = SegmentService(db_session)

    updated = await service.update_segment(show.id, seg.id, SegmentUpdate(name="Renamed", bpm=120))
    assert updated.name == "Renamed"
    assert updated.bpm == 120


async def test_update_segment_replace_variants(db_session: AsyncSession):
    show = await _create_show(db_session)
    seg = await _add_segment(db_session, show, 1)
    await _add_variant(db_session, seg, "full", 240)

    service = SegmentService(db_session)
    updated = await service.update_segment(
        show.id,
        seg.id,
        SegmentUpdate(
            variants=[SegmentVariantCreate(variant_type="acoustic", duration_seconds=200)]
        ),
    )
    assert len(updated.variants) == 1
    assert updated.variants[0].variant_type == "acoustic"


async def test_update_segment_preserve_variants_when_key_absent(db_session: AsyncSession):
    show = await _create_show(db_session)
    seg = await _add_segment(db_session, show, 1)
    await _add_variant(db_session, seg, "full", 240)

    service = SegmentService(db_session)
    updated = await service.update_segment(show.id, seg.id, SegmentUpdate(name="New Name"))
    assert updated.name == "New Name"
    assert len(updated.variants) == 1
    assert updated.variants[0].variant_type == "full"


async def test_update_segment_not_found(db_session: AsyncSession):
    show = await _create_show(db_session)
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.update_segment(show.id, uuid.uuid4(), SegmentUpdate(name="Nope"))
    assert exc.value.status_code == 404


async def test_update_segment_wrong_show(db_session: AsyncSession):
    show1 = await _create_show(db_session, name="Show 1")
    show2 = await _create_show(db_session, name="Show 2")
    seg = await _add_segment(db_session, show1, 1)

    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.update_segment(show2.id, seg.id, SegmentUpdate(name="Wrong"))
    assert exc.value.status_code == 404


async def test_update_segment_live_blocked(db_session: AsyncSession):
    show = await _create_show(db_session, status="live")
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.update_segment(show.id, uuid.uuid4(), SegmentUpdate(name="Nope"))
    assert exc.value.status_code == 409


# --- delete_segment ---


async def test_delete_segment_rebuilds_positions(db_session: AsyncSession):
    show = await _create_show(db_session)
    await _add_segment(db_session, show, 1, name="First")
    seg2 = await _add_segment(db_session, show, 2, name="Second")
    await _add_segment(db_session, show, 3, name="Third")

    service = SegmentService(db_session)
    await service.delete_segment(show.id, seg2.id)

    remaining = await service.list_segments(show.id)
    assert len(remaining) == 2
    assert remaining[0].name == "First"
    assert remaining[0].position == 1
    assert remaining[1].name == "Third"
    assert remaining[1].position == 2


async def test_delete_segment_not_found(db_session: AsyncSession):
    show = await _create_show(db_session)
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.delete_segment(show.id, uuid.uuid4())
    assert exc.value.status_code == 404


async def test_delete_segment_live_blocked(db_session: AsyncSession):
    show = await _create_show(db_session, status="live")
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.delete_segment(show.id, uuid.uuid4())
    assert exc.value.status_code == 409


# --- reorder_segments ---


async def test_reorder_basic(db_session: AsyncSession):
    show = await _create_show(db_session)
    seg1 = await _add_segment(db_session, show, 1, name="A")
    seg2 = await _add_segment(db_session, show, 2, name="B")
    seg3 = await _add_segment(db_session, show, 3, name="C")

    service = SegmentService(db_session)
    result = await service.reorder_segments(
        show.id, SegmentReorderRequest(segment_ids=[seg3.id, seg1.id, seg2.id])
    )
    assert [s.name for s in result] == ["C", "A", "B"]
    assert [s.position for s in result] == [1, 2, 3]


async def test_reorder_locked_segment_same_position_ok(db_session: AsyncSession):
    show = await _create_show(db_session)
    seg1 = await _add_segment(db_session, show, 1, name="Locked", is_locked=True)
    seg2 = await _add_segment(db_session, show, 2, name="B")
    seg3 = await _add_segment(db_session, show, 3, name="C")

    service = SegmentService(db_session)
    # Keep locked at position 1, swap B and C
    result = await service.reorder_segments(
        show.id, SegmentReorderRequest(segment_ids=[seg1.id, seg3.id, seg2.id])
    )
    assert result[0].name == "Locked"
    assert result[0].position == 1


async def test_reorder_locked_segment_moved_409(db_session: AsyncSession):
    show = await _create_show(db_session)
    seg1 = await _add_segment(db_session, show, 1, name="A")
    seg2 = await _add_segment(db_session, show, 2, name="Locked", is_locked=True)

    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.reorder_segments(
            show.id, SegmentReorderRequest(segment_ids=[seg2.id, seg1.id])
        )
    assert exc.value.status_code == 409


async def test_reorder_incomplete_ids_422(db_session: AsyncSession):
    show = await _create_show(db_session)
    seg1 = await _add_segment(db_session, show, 1)
    await _add_segment(db_session, show, 2)

    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.reorder_segments(show.id, SegmentReorderRequest(segment_ids=[seg1.id]))
    assert exc.value.status_code == 422


async def test_reorder_extra_ids_422(db_session: AsyncSession):
    show = await _create_show(db_session)
    seg1 = await _add_segment(db_session, show, 1)

    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.reorder_segments(
            show.id,
            SegmentReorderRequest(segment_ids=[seg1.id, uuid.uuid4()]),
        )
    assert exc.value.status_code == 422


async def test_reorder_live_blocked(db_session: AsyncSession):
    show = await _create_show(db_session, status="live")
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.reorder_segments(show.id, SegmentReorderRequest(segment_ids=[uuid.uuid4()]))
    assert exc.value.status_code == 409


# --- load_template ---


async def test_load_template_append(db_session: AsyncSession):
    show = await _create_show(db_session)
    await _add_segment(db_session, show, 1, name="Existing")

    template = await _create_template(
        db_session,
        segments=[
            {"name": "Tmpl Song 1", "position": 1, "duration_full": 300, "duration_short": 180},
            {"name": "Tmpl Song 2", "position": 2, "duration_full": 240},
        ],
    )

    service = SegmentService(db_session)
    result = await service.load_template(show.id, template.id)

    assert len(result) == 3
    assert result[0].name == "Existing"
    assert result[0].position == 1
    assert result[1].name == "Tmpl Song 1"
    assert result[1].position == 2
    assert result[2].name == "Tmpl Song 2"
    assert result[2].position == 3


async def test_load_template_creates_variants(db_session: AsyncSession):
    show = await _create_show(db_session)
    template = await _create_template(
        db_session,
        segments=[
            {"name": "Song", "position": 1, "duration_full": 300, "duration_short": 180},
        ],
    )

    service = SegmentService(db_session)
    result = await service.load_template(show.id, template.id)

    seg = result[0]
    assert len(seg.variants) == 2
    variant_types = {v.variant_type for v in seg.variants}
    assert variant_types == {"full", "short"}


async def test_load_template_empty_show(db_session: AsyncSession):
    show = await _create_show(db_session)
    template = await _create_template(
        db_session,
        segments=[
            {"name": "Only Song", "position": 1, "duration_full": 200},
        ],
    )

    service = SegmentService(db_session)
    result = await service.load_template(show.id, template.id)

    assert len(result) == 1
    assert result[0].position == 1
    # Only full variant (no short)
    assert len(result[0].variants) == 1
    assert result[0].variants[0].variant_type == "full"


async def test_load_template_not_found(db_session: AsyncSession):
    show = await _create_show(db_session)
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.load_template(show.id, uuid.uuid4())
    assert exc.value.status_code == 404


async def test_load_template_live_blocked(db_session: AsyncSession):
    show = await _create_show(db_session, status="live")
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.load_template(show.id, uuid.uuid4())
    assert exc.value.status_code == 409


# --- import_csv ---


async def test_import_csv_replaces_all(db_session: AsyncSession):
    show = await _create_show(db_session)
    await _add_segment(db_session, show, 1, name="Old Song")

    service = SegmentService(db_session)
    rows = [
        CsvImportRow(name="New A", duration_full=200),
        CsvImportRow(name="New B", duration_full=300, duration_short=180),
    ]
    result = await service.import_csv(show.id, rows)

    assert len(result) == 2
    assert result[0].name == "New A"
    assert result[0].position == 1
    assert result[1].name == "New B"
    assert result[1].position == 2


async def test_import_csv_creates_variants(db_session: AsyncSession):
    show = await _create_show(db_session)
    service = SegmentService(db_session)

    rows = [
        CsvImportRow(name="Song", duration_full=300, duration_short=180),
    ]
    result = await service.import_csv(show.id, rows)

    assert len(result[0].variants) == 2
    variant_types = {v.variant_type for v in result[0].variants}
    assert variant_types == {"full", "short"}


async def test_import_csv_live_blocked(db_session: AsyncSession):
    show = await _create_show(db_session, status="ended")
    service = SegmentService(db_session)
    with pytest.raises(HTTPException) as exc:
        await service.import_csv(show.id, [CsvImportRow(name="X", duration_full=100)])
    assert exc.value.status_code == 409
