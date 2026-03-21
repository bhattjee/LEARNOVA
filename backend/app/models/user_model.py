"""
user_model.py — SQLAlchemy ORM model for the users table.
Represents all user types: Admin, Instructor, and Learner.
"""

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin


class UserRole(str, Enum):
    ADMIN = "admin"
    INSTRUCTOR = "instructor"
    LEARNER = "learner"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, values_callable=lambda x: [e.value for e in x], native_enum=False),
        nullable=False,
        default=UserRole.LEARNER,
    )
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    total_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
