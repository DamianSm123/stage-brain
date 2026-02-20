import datetime

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.report import Report
from src.models.setlist import Segment, SegmentVariant, Setlist
from src.models.show import Show
from src.models.venue import Venue


@pytest.fixture
async def setlist_with_segment(db_session: AsyncSession):
    setlist = Setlist(name="Constraint Setlist")
    db_session.add(setlist)
    await db_session.flush()

    segment = Segment(setlist_id=setlist.id, name="First Song", position=1)
    db_session.add(segment)
    await db_session.flush()

    return setlist, segment


async def test_duplicate_segment_position(db_session: AsyncSession, setlist_with_segment):
    setlist, _ = setlist_with_segment

    duplicate = Segment(setlist_id=setlist.id, name="Duplicate Position", position=1)
    db_session.add(duplicate)

    with pytest.raises(IntegrityError, match="uq_segment_position"):
        await db_session.flush()


async def test_duplicate_variant_type(db_session: AsyncSession, setlist_with_segment):
    _, segment = setlist_with_segment

    v1 = SegmentVariant(segment_id=segment.id, variant_type="full", duration_seconds=200)
    db_session.add(v1)
    await db_session.flush()

    v2 = SegmentVariant(segment_id=segment.id, variant_type="full", duration_seconds=180)
    db_session.add(v2)

    with pytest.raises(IntegrityError, match="uq_segment_variant"):
        await db_session.flush()


async def test_invalid_variant_type(db_session: AsyncSession, setlist_with_segment):
    _, segment = setlist_with_segment

    variant = SegmentVariant(
        segment_id=segment.id,
        variant_type="extended",
        duration_seconds=300,
    )
    db_session.add(variant)

    with pytest.raises(IntegrityError, match="chk_variant_type"):
        await db_session.flush()


async def test_invalid_show_status(db_session: AsyncSession):
    venue = Venue(name="Constraint Venue", type="club")
    db_session.add(venue)
    await db_session.flush()

    show = Show(
        name="Bad Show",
        venue_id=venue.id,
        status="cancelled",
        scheduled_date=datetime.date(2026, 8, 1),
        curfew=datetime.datetime(2026, 8, 1, 23, 0, tzinfo=datetime.UTC),
    )
    db_session.add(show)

    with pytest.raises(IntegrityError, match="chk_show_status"):
        await db_session.flush()


async def test_invalid_report_status(db_session: AsyncSession):
    venue = Venue(name="Report Venue", type="hall")
    db_session.add(venue)
    await db_session.flush()

    show = Show(
        name="Report Show",
        venue_id=venue.id,
        scheduled_date=datetime.date(2026, 9, 1),
        curfew=datetime.datetime(2026, 9, 1, 23, 0, tzinfo=datetime.UTC),
    )
    db_session.add(show)
    await db_session.flush()

    report = Report(show_id=show.id, status="broken")
    db_session.add(report)

    with pytest.raises(IntegrityError, match="chk_report_status"):
        await db_session.flush()
