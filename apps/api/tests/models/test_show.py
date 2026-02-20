import datetime

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.setlist import Setlist
from src.models.show import Show
from src.models.venue import CalibrationPreset, Venue


@pytest.fixture
async def venue(db_session: AsyncSession) -> Venue:
    v = Venue(name="Test Venue", type="hall", capacity=2000)
    db_session.add(v)
    await db_session.flush()
    return v


@pytest.fixture
async def setlist(db_session: AsyncSession) -> Setlist:
    s = Setlist(name="Test Setlist")
    db_session.add(s)
    await db_session.flush()
    return s


@pytest.fixture
async def calibration(db_session: AsyncSession) -> CalibrationPreset:
    c = CalibrationPreset(
        name="Test Calibration",
        energy_baseline=0.3,
        energy_sensitivity=1.0,
        crowd_noise_floor=0.1,
        spectral_threshold=0.5,
        is_system_preset=False,
    )
    db_session.add(c)
    await db_session.flush()
    return c


async def test_create_show(db_session: AsyncSession, venue: Venue):
    show = Show(
        name="Concert Test",
        venue_id=venue.id,
        scheduled_date=datetime.date(2026, 6, 1),
        curfew=datetime.datetime(2026, 6, 1, 23, 0, tzinfo=datetime.UTC),
    )
    db_session.add(show)
    await db_session.flush()

    result = await db_session.execute(select(Show).where(Show.id == show.id))
    fetched = result.scalar_one()
    assert fetched.name == "Concert Test"
    assert fetched.status == "setup"
    assert fetched.scheduled_date == datetime.date(2026, 6, 1)
    assert fetched.id is not None


async def test_show_invalid_status(db_session: AsyncSession, venue: Venue):
    show = Show(
        name="Bad Status",
        venue_id=venue.id,
        status="invalid_status",
        scheduled_date=datetime.date(2026, 6, 1),
        curfew=datetime.datetime(2026, 6, 1, 23, 0, tzinfo=datetime.UTC),
    )
    db_session.add(show)

    with pytest.raises(IntegrityError, match="chk_show_status"):
        await db_session.flush()


async def test_show_relationships(
    db_session: AsyncSession,
    venue: Venue,
    setlist: Setlist,
    calibration: CalibrationPreset,
):
    show = Show(
        name="Full Show",
        venue_id=venue.id,
        setlist_id=setlist.id,
        calibration_id=calibration.id,
        scheduled_date=datetime.date(2026, 7, 1),
        curfew=datetime.datetime(2026, 7, 1, 22, 0, tzinfo=datetime.UTC),
    )
    db_session.add(show)
    await db_session.flush()

    result = await db_session.execute(select(Show).where(Show.id == show.id))
    fetched = result.scalar_one()
    assert fetched.venue_id == venue.id
    assert fetched.setlist_id == setlist.id
    assert fetched.calibration_id == calibration.id
