"""
course_schema.py — Pydantic schemas for course creation, listing, and detail.
"""

from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.course_model import CourseAccessRule, CourseVisibility
from app.schemas.auth_schema import UserPublic


class CreateCourseRequest(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=500)]


class CourseListItem(BaseModel):
    id: UUID
    title: str
    tags: list[str]
    cover_image_url: str | None
    is_published: bool
    views_count: int
    total_lessons_count: int
    total_duration_seconds: int
    created_at: datetime


class CourseListResponse(BaseModel):
    data: list[CourseListItem]
    total: int
    page: int
    limit: int


class CourseItemEnvelope(BaseModel):
    data: CourseListItem


class CourseDetail(BaseModel):
    id: UUID
    title: str
    slug: str
    tags: list[str]
    cover_image_url: str | None
    is_published: bool
    website: str | None
    visibility: CourseVisibility
    access_rule: CourseAccessRule
    price_cents: int | None
    responsible_user_id: UUID | None
    created_by: UUID
    views_count: int
    description: str | None
    created_at: datetime
    updated_at: datetime
    responsible_user: UserPublic | None
    total_lessons_count: int
    total_duration_seconds: int


class CourseDetailEnvelope(BaseModel):
    data: CourseDetail


LearnerCourseStatus = Literal["not_enrolled", "enrolled", "in_progress", "completed"]


class PublicCourseItem(BaseModel):
    id: UUID
    title: str
    slug: str
    cover_image_url: str | None
    tags: list[str]
    description_short: str | None
    total_lessons_count: int
    total_duration_seconds: int
    visibility: CourseVisibility
    access_rule: CourseAccessRule
    price_cents: int | None
    average_rating: float | None = None
    learner_status: LearnerCourseStatus | None = None
    completion_percentage: float | None = Field(
        None,
        description="Present when authenticated and learner_status is in_progress.",
    )


class PublicCoursesListResponse(BaseModel):
    data: list[PublicCourseItem]


class LearnerCourseItem(BaseModel):
    id: UUID
    title: str
    slug: str
    cover_image_url: str | None
    tags: list[str]
    description_short: str | None
    total_lessons_count: int
    total_duration_seconds: int
    visibility: CourseVisibility
    access_rule: CourseAccessRule
    price_cents: int | None
    average_rating: float | None = None
    learner_status: LearnerCourseStatus
    completion_percentage: float
    enrolled_at: datetime


class LearnerCoursesListResponse(BaseModel):
    data: list[LearnerCourseItem]


LessonRowStatus = Literal["not_started", "in_progress", "completed"]
LessonRowType = Literal["video", "document", "image", "quiz"]


class LessonProgressItem(BaseModel):
    lesson_id: UUID
    title: str
    type: LessonRowType
    status: LessonRowStatus
    sort_order: int
    has_attachments: bool
    duration_seconds: int = Field(
        0,
        description="Lesson duration for display in the outline.",
    )


class CourseDetailForLearner(BaseModel):
    id: UUID
    title: str
    slug: str
    description: str | None
    cover_image_url: str | None
    tags: list[str]
    visibility: CourseVisibility
    access_rule: CourseAccessRule
    price_cents: int | None
    average_rating: float | None = None
    total_duration_seconds: int
    total_lessons: int
    completed_count: int
    incomplete_count: int
    completion_percentage: float
    lessons: list[LessonProgressItem]
    enrollment_status: LearnerCourseStatus | None = None


class CourseDetailForLearnerEnvelope(BaseModel):
    data: CourseDetailForLearner


class CompleteCourseResult(BaseModel):
    completed: bool
    completion_date: datetime


class CompleteCourseEnvelope(BaseModel):
    data: CompleteCourseResult


class UpdateCourseRequest(BaseModel):
    title: Annotated[str | None, Field(None, min_length=1, max_length=500)] = None
    tags: list[str] | None = None
    website: str | None = None
    responsible_user_id: UUID | None = None
    visibility: CourseVisibility | None = None
    access_rule: CourseAccessRule | None = None
    price_cents: int | None = None
    description: Annotated[str | None, Field(None, max_length=5000)] = None

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class UsersListResponse(BaseModel):
    data: list[UserPublic]


class UpdateCourseOptions(BaseModel):
    """Partial update for course options tab (visibility, access, pricing, owner)."""

    visibility: CourseVisibility | None = None
    access_rule: CourseAccessRule | None = None
    price_cents: int | None = None
    responsible_user_id: UUID | None = None


class AddAttendeesRequest(BaseModel):
    emails: list[str]


class AddAttendeesResponse(BaseModel):
    added: int
    already_enrolled: int
    emails_queued: int


class ContactAttendeesRequest(BaseModel):
    subject: Annotated[str, Field(min_length=1, max_length=500)]
    body: Annotated[str, Field(min_length=1, max_length=20000)]


class ContactAttendeesResponse(BaseModel):
    queued: int


class CourseAttendeesResponse(BaseModel):
    data: list[UserPublic]
