import datetime

from sqlalchemy import BigInteger, Float, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TZDateTime


class EngagementMetric(Base):
    __tablename__ = "engagement_metrics"
    __table_args__ = (
        Index(
            "idx_engagement_show_time",
            "show_id",
            "timestamp",
            postgresql_ops={"timestamp": "DESC"},
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, autoincrement=True, primary_key=True)
    timestamp: Mapped[datetime.datetime] = mapped_column(TZDateTime, primary_key=True)
    show_id: Mapped[str] = mapped_column(UUID(as_uuid=True), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    rms_energy: Mapped[float | None] = mapped_column(Float)
    spectral_centroid: Mapped[float | None] = mapped_column(Float)
    zcr: Mapped[float | None] = mapped_column(Float)
    spectral_rolloff: Mapped[float | None] = mapped_column(Float)
    event_type: Mapped[str | None] = mapped_column(String(50))
    event_confidence: Mapped[float | None] = mapped_column(Float)
    trend: Mapped[str | None] = mapped_column(String(10))
    raw_features: Mapped[dict | None] = mapped_column(JSONB)
