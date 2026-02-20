import datetime
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TZDateTime

if TYPE_CHECKING:
    from src.models.setlist import Segment, SegmentVariant
    from src.models.show import Show


class ShowTimeline(Base):
    __tablename__ = "show_timeline"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'completed', 'skipped')",
            name="chk_timeline_status",
        ),
        Index("idx_timeline_show", "show_id"),
        Index("idx_timeline_show_segment", "show_id", "segment_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    show_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shows.id"), nullable=False)
    segment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("segments.id"), nullable=False)
    variant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("segment_variants.id"))
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    started_at: Mapped[datetime.datetime | None] = mapped_column(TZDateTime)
    ended_at: Mapped[datetime.datetime | None] = mapped_column(TZDateTime)
    planned_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    actual_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    delta_seconds: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TZDateTime,
        server_default=func.now(),
        nullable=False,
    )

    show: Mapped["Show"] = relationship(back_populates="timeline_entries")
    segment: Mapped["Segment"] = relationship()
    variant: Mapped["SegmentVariant | None"] = relationship()
