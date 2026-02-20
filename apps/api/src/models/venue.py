import datetime
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin, TZDateTime

if TYPE_CHECKING:
    from src.models.show import Show


class Venue(TimestampMixin, Base):
    __tablename__ = "venues"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity: Mapped[int | None] = mapped_column(Integer)
    city: Mapped[str | None] = mapped_column(String(255))
    country: Mapped[str | None] = mapped_column(String(100), server_default="PL")
    default_calibration_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("calibration_presets.id"),
    )

    default_calibration: Mapped["CalibrationPreset | None"] = relationship(
        back_populates="venues",
        lazy="selectin",
    )
    shows: Mapped[list["Show"]] = relationship(back_populates="venue")


class CalibrationPreset(Base):
    __tablename__ = "calibration_presets"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    venue_type: Mapped[str | None] = mapped_column(String(50))
    capacity_min: Mapped[int | None] = mapped_column(Integer)
    capacity_max: Mapped[int | None] = mapped_column(Integer)
    genre: Mapped[str | None] = mapped_column(String(100))
    energy_baseline: Mapped[float] = mapped_column(Float, nullable=False, server_default="0.3")
    energy_sensitivity: Mapped[float] = mapped_column(Float, nullable=False, server_default="1.0")
    crowd_noise_floor: Mapped[float] = mapped_column(Float, nullable=False, server_default="0.1")
    spectral_threshold: Mapped[float] = mapped_column(Float, nullable=False, server_default="0.5")
    is_system_preset: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TZDateTime,
        server_default=func.now(),
        nullable=False,
    )

    venues: Mapped[list["Venue"]] = relationship(back_populates="default_calibration")
