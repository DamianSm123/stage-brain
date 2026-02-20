from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.venue import CalibrationPreset, Venue


async def test_create_venue(db_session: AsyncSession):
    venue = Venue(name="Test Venue", type="hall", capacity=1000, city="Kraków")
    db_session.add(venue)
    await db_session.flush()

    result = await db_session.execute(select(Venue).where(Venue.id == venue.id))
    fetched = result.scalar_one()
    assert fetched.name == "Test Venue"
    assert fetched.type == "hall"
    assert fetched.capacity == 1000
    assert fetched.city == "Kraków"
    assert fetched.country == "PL"
    assert fetched.id is not None
    assert fetched.created_at is not None


async def test_create_calibration_preset(db_session: AsyncSession):
    preset = CalibrationPreset(
        name="Test Preset",
        venue_type="club",
        capacity_min=100,
        capacity_max=500,
        genre="rock",
        energy_baseline=0.4,
        energy_sensitivity=1.2,
        crowd_noise_floor=0.15,
        spectral_threshold=0.6,
        is_system_preset=False,
    )
    db_session.add(preset)
    await db_session.flush()

    result = await db_session.execute(
        select(CalibrationPreset).where(CalibrationPreset.id == preset.id)
    )
    fetched = result.scalar_one()
    assert fetched.name == "Test Preset"
    assert fetched.venue_type == "club"
    assert fetched.genre == "rock"
    assert fetched.energy_baseline == 0.4
    assert fetched.is_system_preset is False


async def test_venue_calibration_relationship(db_session: AsyncSession):
    preset = CalibrationPreset(
        name="Linked Preset",
        energy_baseline=0.3,
        energy_sensitivity=1.0,
        crowd_noise_floor=0.1,
        spectral_threshold=0.5,
        is_system_preset=True,
    )
    db_session.add(preset)
    await db_session.flush()

    venue = Venue(
        name="Linked Venue",
        type="stadium",
        default_calibration_id=preset.id,
    )
    db_session.add(venue)
    await db_session.flush()

    result = await db_session.execute(select(Venue).where(Venue.id == venue.id))
    fetched = result.scalar_one()
    assert fetched.default_calibration_id == preset.id
