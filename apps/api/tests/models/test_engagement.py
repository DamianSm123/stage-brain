import datetime
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.engagement import EngagementMetric


async def test_insert_engagement_metric(db_session: AsyncSession):
    show_id = uuid.uuid4()
    metric = EngagementMetric(
        show_id=str(show_id),
        timestamp=datetime.datetime(2026, 5, 1, 20, 0, 1, tzinfo=datetime.UTC),
        score=0.75,
        rms_energy=0.4,
        spectral_centroid=2000.0,
        zcr=0.05,
        event_type="cheering",
        event_confidence=0.9,
        trend="rising",
    )
    db_session.add(metric)
    await db_session.flush()

    result = await db_session.execute(
        select(EngagementMetric).where(EngagementMetric.id == metric.id)
    )
    fetched = result.scalar_one()
    assert fetched.score == 0.75
    assert fetched.event_type == "cheering"
    assert fetched.trend == "rising"


async def test_bulk_insert_engagement_metrics(db_session: AsyncSession):
    show_id = uuid.uuid4()
    base_time = datetime.datetime(2026, 5, 1, 20, 0, 0, tzinfo=datetime.UTC)

    metrics = [
        EngagementMetric(
            show_id=str(show_id),
            timestamp=base_time + datetime.timedelta(seconds=i),
            score=0.5 + i * 0.01,
        )
        for i in range(10)
    ]
    db_session.add_all(metrics)
    await db_session.flush()

    result = await db_session.execute(
        select(func.count())
        .select_from(EngagementMetric)
        .where(EngagementMetric.show_id == str(show_id))
    )
    count = result.scalar_one()
    assert count == 10
