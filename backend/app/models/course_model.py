"""
course_model.py — SQLAlchemy ORM model for the courses table.
Represents an eLearning course created by an instructor or admin.
"""

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin


class CourseVisibility(str, Enum):
    EVERYONE = "everyone"
    SIGNED_IN = "signed_in"


class CourseAccessRule(str, Enum):
    OPEN = "open"
    ON_INVITATION = "on_invitation"
    ON_PAYMENT = "on_payment"


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), unique=True, nullable=False, index=True)
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        server_default=text("'{}'::varchar[]"),
    )
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    visibility: Mapped[CourseVisibility] = mapped_column(
        SAEnum(
            CourseVisibility,
            values_callable=lambda x: [e.value for e in x],
            native_enum=False,
        ),
        nullable=False,
        default=CourseVisibility.EVERYONE,
    )
    access_rule: Mapped[CourseAccessRule] = mapped_column(
        SAEnum(
            CourseAccessRule,
            values_callable=lambda x: [e.value for e in x],
            native_enum=False,
        ),
        nullable=False,
        default=CourseAccessRule.OPEN,
    )
    price_cents: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    responsible_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    views_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
