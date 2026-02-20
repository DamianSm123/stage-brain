from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.setlist import Segment, SegmentVariant, Setlist


async def test_create_setlist_with_segments(db_session: AsyncSession):
    setlist = Setlist(name="My Setlist", total_planned_duration_seconds=600)
    db_session.add(setlist)
    await db_session.flush()

    seg1 = Segment(setlist_id=setlist.id, name="Song A", position=1, bpm=120, genre="pop")
    seg2 = Segment(setlist_id=setlist.id, name="Song B", position=2, bpm=90, genre="rock")
    db_session.add_all([seg1, seg2])
    await db_session.flush()

    result = await db_session.execute(
        select(Segment).where(Segment.setlist_id == setlist.id).order_by(Segment.position)
    )
    segments = result.scalars().all()
    assert len(segments) == 2
    assert segments[0].name == "Song A"
    assert segments[1].name == "Song B"


async def test_create_segment_variants(db_session: AsyncSession):
    setlist = Setlist(name="Variant Setlist")
    db_session.add(setlist)
    await db_session.flush()

    segment = Segment(setlist_id=setlist.id, name="Variant Song", position=1)
    db_session.add(segment)
    await db_session.flush()

    full_variant = SegmentVariant(
        segment_id=segment.id,
        variant_type="full",
        duration_seconds=240,
    )
    short_variant = SegmentVariant(
        segment_id=segment.id,
        variant_type="short",
        duration_seconds=180,
        description="Bez drugiego refrenu",
    )
    db_session.add_all([full_variant, short_variant])
    await db_session.flush()

    result = await db_session.execute(
        select(SegmentVariant).where(SegmentVariant.segment_id == segment.id)
    )
    variants = result.scalars().all()
    assert len(variants) == 2


async def test_cascade_delete_segments(db_session: AsyncSession):
    setlist = Setlist(name="Cascade Setlist")
    db_session.add(setlist)
    await db_session.flush()

    seg = Segment(setlist_id=setlist.id, name="To Delete", position=1)
    db_session.add(seg)
    await db_session.flush()

    variant = SegmentVariant(
        segment_id=seg.id,
        variant_type="full",
        duration_seconds=200,
    )
    db_session.add(variant)
    await db_session.flush()

    # Delete setlist should cascade to segments and variants
    await db_session.delete(setlist)
    await db_session.flush()

    result = await db_session.execute(select(Segment).where(Segment.setlist_id == setlist.id))
    assert result.scalar_one_or_none() is None

    result = await db_session.execute(
        select(SegmentVariant).where(SegmentVariant.segment_id == seg.id)
    )
    assert result.scalar_one_or_none() is None
