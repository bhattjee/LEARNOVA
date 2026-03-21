"""
quiz_model.py — SQLAlchemy ORM models for quizzes, questions, and answer options.
A quiz belongs to a course and has configurable per-attempt point rewards.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin


class Quiz(Base, TimestampMixin):
    __tablename__ = "quizzes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    attempt_1_points: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    attempt_2_points: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    attempt_3_points: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    attempt_4plus_points: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    questions: Mapped[list["Question"]] = relationship(
        "Question",
        back_populates="quiz",
        lazy="selectin",
    )


class Question(Base, TimestampMixin):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    quiz_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="questions")
    options: Mapped[list["QuestionOption"]] = relationship(
        "QuestionOption",
        back_populates="question",
        lazy="selectin",
        order_by="QuestionOption.sort_order",
    )


class QuestionOption(Base, TimestampMixin):
    __tablename__ = "question_options"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    text: Mapped[str] = mapped_column(String(1000), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    question: Mapped["Question"] = relationship("Question", back_populates="options")
