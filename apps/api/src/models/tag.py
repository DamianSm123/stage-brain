import datetime
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TZDateTime

if TYPE_CHECKING:
    from src.models.show import Show


class OperatorTag(Base):
    __tablename__ = "operator_tags"
    __table_args__ = (
        Index("idx_tags_show", "show_id"),
        Index(
            "idx_tags_show_time",
            "show_id",
            "timestamp",
            postgresql_ops={"timestamp": "DESC"},
        ),
    )

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
    tag: Mapped[str] = mapped_column(String(100), nullable=False)
    custom_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TZDateTime,
        server_default=func.now(),
        nullable=False,
    )

    show: Mapped["Show"] = relationship(back_populates="tags")
