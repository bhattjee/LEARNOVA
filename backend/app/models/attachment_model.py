"""
attachment_model.py — Extra resources linked to a lesson (file or external link).
"""

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin


class AttachmentType(str, Enum):
    FILE = "file"
    LINK = "link"


class LessonAttachment(Base, TimestampMixin):
    __tablename__ = "lesson_attachments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[AttachmentType] = mapped_column(
        SAEnum(AttachmentType, values_callable=lambda x: [e.value for e in x], native_enum=False),
        nullable=False,
    )
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="attachments")
