import datetime
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TZDateTime

if TYPE_CHECKING:
    from src.models.show import Show


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'generating', 'generated', 'failed')",
            name="chk_report_status",
        ),
        Index("idx_reports_show", "show_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    show_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shows.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pdf")
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")
    file_path: Mapped[str | None] = mapped_column(String(500))
    error_message: Mapped[str | None] = mapped_column(Text)
    generated_at: Mapped[datetime.datetime | None] = mapped_column(TZDateTime)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TZDateTime,
        server_default=func.now(),
        nullable=False,
    )

    show: Mapped["Show"] = relationship(back_populates="reports")
