import datetime
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, TZDateTime

if TYPE_CHECKING:
    from src.models.recommendation import RecommendationLog
    from src.models.report import Report
    from src.models.tag import OperatorTag
    from src.models.timeline import ShowTimeline
    from src.models.venue import CalibrationPreset, Venue

    from .setlist import Setlist


class Show(TimestampMixin, Base):
    __tablename__ = "shows"
    __table_args__ = (
        CheckConstraint(
            "status IN ('setup', 'live', 'paused', 'ended')",
            name="chk_show_status",
        ),
        Index("idx_shows_status", "status"),
        Index("idx_shows_venue", "venue_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    venue_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("venues.id"), nullable=False)
    setlist_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("setlists.id"))
    calibration_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("calibration_presets.id"),
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="setup")
    scheduled_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    scheduled_start: Mapped[datetime.datetime | None] = mapped_column(TZDateTime)
    actual_start: Mapped[datetime.datetime | None] = mapped_column(TZDateTime)
    actual_end: Mapped[datetime.datetime | None] = mapped_column(TZDateTime)
    curfew: Mapped[datetime.datetime] = mapped_column(TZDateTime, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    venue: Mapped["Venue"] = relationship(back_populates="shows")
    setlist: Mapped["Setlist | None"] = relationship()
    calibration: Mapped["CalibrationPreset | None"] = relationship()
    timeline_entries: Mapped[list["ShowTimeline"]] = relationship(back_populates="show")
    recommendations: Mapped[list["RecommendationLog"]] = relationship(
        back_populates="show",
    )
    tags: Mapped[list["OperatorTag"]] = relationship(back_populates="show")
    reports: Mapped[list["Report"]] = relationship(back_populates="show")
