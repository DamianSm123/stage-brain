import uuid

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.setlist_template import SetlistTemplate, TemplateSegment


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
            session.add(
                TemplateSegment(
                    template_id=template.id,
                    name=seg_data["name"],
                    position=seg_data["position"],
                    duration_full=seg_data["duration_full"],
                    duration_short=seg_data.get("duration_short"),
                    note=seg_data.get("note"),
                )
            )
        template.total_duration_full = sum(s["duration_full"] for s in segments)
        template.total_duration_short = sum(s.get("duration_short") or 0 for s in segments)
    await session.flush()
    return template


# --- GET /templates ---


async def test_list_templates_empty(client: AsyncClient):
    resp = await client.get("/api/v1/templates")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []


async def test_list_templates_with_data(client: AsyncClient, db_session: AsyncSession):
    await _create_template(
        db_session,
        name="Rock Set",
        segments=[
            {"name": "Song 1", "position": 1, "duration_full": 300},
            {"name": "Song 2", "position": 2, "duration_full": 240, "duration_short": 180},
        ],
    )

    resp = await client.get("/api/v1/templates")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    item = data["items"][0]
    assert item["name"] == "Rock Set"
    assert item["segment_count"] == 2
    assert item["total_duration_full"] == 540
    assert item["total_duration_short"] == 180


async def test_list_templates_search(client: AsyncClient, db_session: AsyncSession):
    await _create_template(db_session, name="Rock Night")
    await _create_template(db_session, name="Jazz Evening")

    resp = await client.get("/api/v1/templates", params={"search": "Rock"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["name"] == "Rock Night"


async def test_list_templates_pagination(client: AsyncClient, db_session: AsyncSession):
    for i in range(5):
        await _create_template(db_session, name=f"Template {i}")

    resp = await client.get("/api/v1/templates", params={"page": 1, "page_size": 2})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 5
    assert len(data["items"]) == 2
    assert data["pages"] == 3


# --- POST /templates ---


async def test_create_template(client: AsyncClient):
    resp = await client.post(
        "/api/v1/templates",
        json={
            "name": "New Template",
            "segments": [
                {"name": "Song A", "position": 1, "duration_full": 300},
                {"name": "Song B", "position": 2, "duration_full": 200, "duration_short": 150},
            ],
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "New Template"
    assert len(data["segments"]) == 2
    assert data["total_duration_full"] == 500
    assert data["total_duration_short"] == 150


async def test_create_template_minimal(client: AsyncClient):
    resp = await client.post("/api/v1/templates", json={"name": "Empty"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["segments"] == []
    assert data["total_duration_full"] == 0


# --- GET /templates/{id} ---


async def test_get_template(client: AsyncClient, db_session: AsyncSession):
    template = await _create_template(
        db_session,
        name="Detail",
        segments=[{"name": "S1", "position": 1, "duration_full": 100}],
    )

    resp = await client.get(f"/api/v1/templates/{template.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Detail"
    assert len(data["segments"]) == 1


async def test_get_template_not_found(client: AsyncClient):
    resp = await client.get(f"/api/v1/templates/{uuid.uuid4()}")
    assert resp.status_code == 404


# --- PUT /templates/{id} ---


async def test_update_template_name(client: AsyncClient, db_session: AsyncSession):
    template = await _create_template(db_session, name="Old Name")

    resp = await client.put(
        f"/api/v1/templates/{template.id}",
        json={"name": "New Name"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


async def test_update_template_replace_segments(client: AsyncClient, db_session: AsyncSession):
    template = await _create_template(
        db_session,
        segments=[{"name": "Old Song", "position": 1, "duration_full": 100}],
    )

    resp = await client.put(
        f"/api/v1/templates/{template.id}",
        json={
            "segments": [
                {"name": "New Song 1", "position": 1, "duration_full": 200},
                {"name": "New Song 2", "position": 2, "duration_full": 300, "duration_short": 180},
            ]
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["segments"]) == 2
    assert data["total_duration_full"] == 500
    assert data["total_duration_short"] == 180


# --- DELETE /templates/{id} ---


async def test_delete_template(client: AsyncClient, db_session: AsyncSession):
    template = await _create_template(db_session)
    resp = await client.delete(f"/api/v1/templates/{template.id}")
    assert resp.status_code == 204


async def test_delete_template_not_found(client: AsyncClient):
    resp = await client.delete(f"/api/v1/templates/{uuid.uuid4()}")
    assert resp.status_code == 404
