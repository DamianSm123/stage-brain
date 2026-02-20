import datetime
import uuid

from sqlalchemy import (
    CheckConstraint,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, TZDateTime


class Setlist(TimestampMixin, Base):
    __tablename__ = "setlists"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    total_planned_duration_seconds: Mapped[int | None] = mapped_column(Integer)

    segments: Mapped[list["Segment"]] = relationship(
        back_populates="setlist",
        cascade="all, delete-orphan",
        order_by="Segment.position",
    )


class Segment(Base):
    __tablename__ = "segments"
    __table_args__ = (
        UniqueConstraint("setlist_id", "position", name="uq_segment_position"),
        Index("idx_segments_setlist", "setlist_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    setlist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("setlists.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    bpm: Mapped[int | None] = mapped_column(Integer)
    genre: Mapped[str | None] = mapped_column(String(100))
    expected_energy: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TZDateTime,
        server_default=func.now(),
        nullable=False,
    )

    setlist: Mapped["Setlist"] = relationship(back_populates="segments")
    variants: Mapped[list["SegmentVariant"]] = relationship(
        back_populates="segment",
        cascade="all, delete-orphan",
    )


class SegmentVariant(Base):
    __tablename__ = "segment_variants"
    __table_args__ = (
        UniqueConstraint("segment_id", "variant_type", name="uq_segment_variant"),
        CheckConstraint(
            "variant_type IN ('full', 'short')",
            name="chk_variant_type",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    segment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("segments.id", ondelete="CASCADE"),
        nullable=False,
    )
    variant_type: Mapped[str] = mapped_column(String(20), nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TZDateTime,
        server_default=func.now(),
        nullable=False,
    )

    segment: Mapped["Segment"] = relationship(back_populates="variants")
