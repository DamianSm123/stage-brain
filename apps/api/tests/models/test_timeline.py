import datetime

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.setlist import Segment, Setlist
from src.models.show import Show
from src.models.timeline import ShowTimeline
from src.models.venue import Venue


@pytest.fixture
async def show_with_segment(db_session: AsyncSession):
    venue = Venue(name="Timeline Venue", type="hall")
    db_session.add(venue)
    await db_session.flush()

    setlist = Setlist(name="Timeline Setlist")
    db_session.add(setlist)
    await db_session.flush()

    segment = Segment(setlist_id=setlist.id, name="Song X", position=1)
    db_session.add(segment)
    await db_session.flush()

    show = Show(
        name="Timeline Show",
        venue_id=venue.id,
        setlist_id=setlist.id,
        scheduled_date=datetime.date(2026, 5, 1),
        curfew=datetime.datetime(2026, 5, 1, 23, 0, tzinfo=datetime.UTC),
    )
    db_session.add(show)
    await db_session.flush()

    return show, segment


async def test_create_timeline_entry(db_session: AsyncSession, show_with_segment):
    show, segment = show_with_segment

    entry = ShowTimeline(
        show_id=show.id,
        segment_id=segment.id,
        status="completed",
        started_at=datetime.datetime(2026, 5, 1, 20, 0, tzinfo=datetime.UTC),
        ended_at=datetime.datetime(2026, 5, 1, 20, 4, tzinfo=datetime.UTC),
        planned_duration_seconds=210,
        actual_duration_seconds=240,
        delta_seconds=30,
    )
    db_session.add(entry)
    await db_session.flush()

    result = await db_session.execute(select(ShowTimeline).where(ShowTimeline.id == entry.id))
    fetched = result.scalar_one()
    assert fetched.status == "completed"
    assert fetched.delta_seconds == 30


async def test_timeline_invalid_status(db_session: AsyncSession, show_with_segment):
    show, segment = show_with_segment

    entry = ShowTimeline(
        show_id=show.id,
        segment_id=segment.id,
        status="invalid",
    )
    db_session.add(entry)

    with pytest.raises(IntegrityError, match="chk_timeline_status"):
        await db_session.flush()
