import uuid

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.segment import Segment, SegmentVariant
from src.models.setlist_template import SetlistTemplate, TemplateSegment
from src.models.show import Show


async def _create_show(
    session: AsyncSession,
    *,
    name: str = "Test Show",
    status: str = "draft",
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
    v = SegmentVariant(
        segment_id=segment.id,
        variant_type=variant_type,
        duration_seconds=duration,
    )
    session.add(v)
    await session.flush()
    return v


async def _create_template(
    session: AsyncSession,
    segments: list[dict],
) -> SetlistTemplate:
    template = SetlistTemplate(
        name="Template",
        total_duration_full=sum(s["duration_full"] for s in segments),
        total_duration_short=sum(s.get("duration_short") or 0 for s in segments),
    )
    session.add(template)
    await session.flush()
    for seg_data in segments:
        session.add(
            TemplateSegment(
                template_id=template.id,
                name=seg_data["name"],
                position=seg_data["position"],
                duration_full=seg_data["duration_full"],
                duration_short=seg_data.get("duration_short"),
            )
        )
    await session.flush()
    return template


# --- GET /shows/{id}/segments ---


async def test_list_segments_empty(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    resp = await client.get(f"/api/v1/shows/{show.id}/segments")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_segments_with_data(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    seg = await _add_segment(db_session, show, 1, name="Hello")
    await _add_variant(db_session, seg)

    resp = await client.get(f"/api/v1/shows/{show.id}/segments")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "Hello"
    assert len(data[0]["variants"]) == 1


async def test_list_segments_show_not_found(client: AsyncClient):
    resp = await client.get(f"/api/v1/shows/{uuid.uuid4()}/segments")
    assert resp.status_code == 404


# --- POST /shows/{id}/segments ---


async def test_create_segment(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    resp = await client.post(
        f"/api/v1/shows/{show.id}/segments",
        json={"name": "New Song", "type": "song"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "New Song"
    assert data["position"] == 1


async def test_create_segment_with_variants(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    resp = await client.post(
        f"/api/v1/shows/{show.id}/segments",
        json={
            "name": "Song",
            "variants": [
                {"variant_type": "full", "duration_seconds": 300},
                {"variant_type": "short", "duration_seconds": 180},
            ],
        },
    )
    assert resp.status_code == 201
    assert len(resp.json()["variants"]) == 2


async def test_create_segment_live_409(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session, status="live")
    resp = await client.post(
        f"/api/v1/shows/{show.id}/segments",
        json={"name": "Blocked"},
    )
    assert resp.status_code == 409


# --- PUT /shows/{id}/segments/{seg_id} ---


async def test_update_segment(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    seg = await _add_segment(db_session, show, 1)

    resp = await client.put(
        f"/api/v1/shows/{show.id}/segments/{seg.id}",
        json={"name": "Updated"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated"


async def test_update_segment_not_found(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    resp = await client.put(
        f"/api/v1/shows/{show.id}/segments/{uuid.uuid4()}",
        json={"name": "Nope"},
    )
    assert resp.status_code == 404


# --- DELETE /shows/{id}/segments/{seg_id} ---


async def test_delete_segment(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    seg = await _add_segment(db_session, show, 1)

    resp = await client.delete(f"/api/v1/shows/{show.id}/segments/{seg.id}")
    assert resp.status_code == 204


async def test_delete_segment_not_found(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    resp = await client.delete(f"/api/v1/shows/{show.id}/segments/{uuid.uuid4()}")
    assert resp.status_code == 404


# --- POST /shows/{id}/segments/reorder ---


async def test_reorder_segments(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    seg1 = await _add_segment(db_session, show, 1, name="A")
    seg2 = await _add_segment(db_session, show, 2, name="B")

    resp = await client.post(
        f"/api/v1/shows/{show.id}/segments/reorder",
        json={"segment_ids": [str(seg2.id), str(seg1.id)]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["name"] == "B"
    assert data[1]["name"] == "A"


async def test_reorder_incomplete_ids_422(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    seg1 = await _add_segment(db_session, show, 1)
    await _add_segment(db_session, show, 2)

    resp = await client.post(
        f"/api/v1/shows/{show.id}/segments/reorder",
        json={"segment_ids": [str(seg1.id)]},
    )
    assert resp.status_code == 422


# --- POST /shows/{id}/segments/load-template/{template_id} ---


async def test_load_template(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    template = await _create_template(
        db_session,
        segments=[
            {"name": "T1", "position": 1, "duration_full": 300},
            {"name": "T2", "position": 2, "duration_full": 200, "duration_short": 120},
        ],
    )

    resp = await client.post(f"/api/v1/shows/{show.id}/segments/load-template/{template.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["name"] == "T1"


async def test_load_template_not_found(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    resp = await client.post(f"/api/v1/shows/{show.id}/segments/load-template/{uuid.uuid4()}")
    assert resp.status_code == 404


# --- POST /shows/{id}/segments/import-csv ---


async def test_import_csv(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    await _add_segment(db_session, show, 1, name="Old")

    resp = await client.post(
        f"/api/v1/shows/{show.id}/segments/import-csv",
        json={
            "segments": [
                {"name": "New A", "duration_full": 200},
                {"name": "New B", "duration_full": 300, "duration_short": 180},
            ]
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["name"] == "New A"


async def test_import_csv_empty_segments_422(client: AsyncClient, db_session: AsyncSession):
    show = await _create_show(db_session)
    resp = await client.post(
        f"/api/v1/shows/{show.id}/segments/import-csv",
        json={"segments": []},
    )
    assert resp.status_code == 422
