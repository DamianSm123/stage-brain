"""Seed script — creates sample data for local development.

Usage:
    cd apps/api && python scripts/seed.py
"""

import asyncio
import datetime
import sys
from pathlib import Path

# Ensure project root is on sys.path when running as a script
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.settings import settings
from src.models.setlist import Segment, SegmentVariant, Setlist
from src.models.show import Show
from src.models.venue import CalibrationPreset, Venue


async def seed(session: AsyncSession) -> None:
    # Check if venue already exists (idempotent)
    result = await session.execute(select(Venue).where(Venue.name == "Teatr Wielki — Warszawa"))
    if result.scalar_one_or_none() is not None:
        print("Seed data already exists, skipping.")
        return

    # Get hip-hop calibration preset
    result = await session.execute(
        select(CalibrationPreset).where(CalibrationPreset.name == "Hala 3000-8000 / Hip-hop")
    )
    calibration = result.scalar_one()

    # Venue
    venue = Venue(
        name="Teatr Wielki — Warszawa",
        type="hall",
        capacity=3000,
        city="Warszawa",
        country="PL",
        default_calibration_id=calibration.id,
    )
    session.add(venue)
    await session.flush()

    # Setlist
    setlist = Setlist(
        name="Quebonafide — Full Set",
        description="Pełna setlista koncertowa",
        total_planned_duration_seconds=1025,
    )
    session.add(setlist)
    await session.flush()

    # Segments with variants
    segments_data = [
        {
            "name": "Tatuaż",
            "position": 1,
            "bpm": 90,
            "genre": "hip-hop",
            "expected_energy": 0.6,
            "variants": [
                {"variant_type": "full", "duration_seconds": 210},
                {"variant_type": "short", "duration_seconds": 165},
            ],
        },
        {
            "name": "Candy",
            "position": 2,
            "bpm": 110,
            "genre": "hip-hop",
            "expected_energy": 0.8,
            "variants": [
                {"variant_type": "full", "duration_seconds": 200},
                {"variant_type": "short", "duration_seconds": 150},
            ],
        },
        {
            "name": "Bubbletea",
            "position": 3,
            "bpm": 100,
            "genre": "pop",
            "expected_energy": 0.7,
            "variants": [
                {"variant_type": "full", "duration_seconds": 180},
            ],
        },
        {
            "name": "Jesień",
            "position": 4,
            "bpm": 75,
            "genre": "ballad",
            "expected_energy": 0.3,
            "variants": [
                {"variant_type": "full", "duration_seconds": 240},
                {"variant_type": "short", "duration_seconds": 180},
            ],
        },
        {
            "name": "Szubiepp",
            "position": 5,
            "bpm": 130,
            "genre": "trap",
            "expected_energy": 0.9,
            "variants": [
                {"variant_type": "full", "duration_seconds": 195},
            ],
        },
    ]

    for seg_data in segments_data:
        variants_data = seg_data.pop("variants")
        segment = Segment(setlist_id=setlist.id, **seg_data)
        session.add(segment)
        await session.flush()

        for var_data in variants_data:
            variant = SegmentVariant(segment_id=segment.id, **var_data)
            session.add(variant)

    # Show
    show = Show(
        name="Quebonafide — Warszawa 15.05.2026",
        venue_id=venue.id,
        setlist_id=setlist.id,
        calibration_id=calibration.id,
        status="setup",
        scheduled_date=datetime.date(2026, 5, 15),
        scheduled_start=datetime.datetime(2026, 5, 15, 20, 0, tzinfo=datetime.UTC),
        curfew=datetime.datetime(2026, 5, 15, 22, 0, tzinfo=datetime.UTC),
    )
    session.add(show)
    await session.flush()

    print(f"Seeded venue: {venue.name} (id={venue.id})")
    print(f"Seeded setlist: {setlist.name} (id={setlist.id})")
    print(f"Seeded show: {show.name} (id={show.id})")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session, session.begin():
        await seed(session)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
