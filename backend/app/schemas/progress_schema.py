"""
progress_schema.py — Pydantic schemas for tracking learner progress through lessons.
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

LessonProgressStatusApi = Literal["not_started", "in_progress", "completed"]


class StartLessonRequest(BaseModel):
    lesson_id: UUID
    course_id: UUID


class CompleteLessonRequest(BaseModel):
    lesson_id: UUID
    course_id: UUID
    time_spent_seconds: int = Field(0, ge=0, le=86400 * 7)


class LessonProgressResponse(BaseModel):
    lesson_id: UUID
    status: LessonProgressStatusApi
    time_spent_seconds: int
    completed_at: datetime | None


class CompleteLessonResult(BaseModel):
    """Response after marking a lesson complete (or recording time on re-complete)."""

    lesson_status: Literal["completed"]
    course_completion_percentage: float
    all_completed: bool
    lesson_id: UUID
    time_spent_seconds: int
    completed_at: datetime | None


class StartLessonEnvelope(BaseModel):
    data: LessonProgressResponse


class CompleteLessonEnvelope(BaseModel):
    data: CompleteLessonResult
