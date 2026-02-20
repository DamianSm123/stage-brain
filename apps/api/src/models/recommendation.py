import datetime
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TZDateTime

if TYPE_CHECKING:
    from src.models.setlist import Segment
    from src.models.show import Show


class RecommendationLog(Base):
    __tablename__ = "recommendations_log"
    __table_args__ = (Index("idx_reco_show", "show_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    show_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shows.id"), nullable=False)
    timestamp: Mapped[datetime.datetime] = mapped_column(
        TZDateTime,
        server_default=func.now(),
        nullable=False,
    )
    recommended_segments: Mapped[dict] = mapped_column(JSONB, nullable=False)
    model_version: Mapped[str | None] = mapped_column(String(50))
    model_confidence: Mapped[float | None] = mapped_column(Float)
    fallback_used: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )
    operator_decision: Mapped[str | None] = mapped_column(String(20))
    accepted_segment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("segments.id"),
    )
    decided_at: Mapped[datetime.datetime | None] = mapped_column(TZDateTime)

    show: Mapped["Show"] = relationship(back_populates="recommendations")
    accepted_segment: Mapped["Segment | None"] = relationship()
