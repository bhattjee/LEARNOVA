"""
lesson_schema.py — Pydantic schemas for lessons and attachments.
"""

from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.attachment_model import AttachmentType
from app.models.lesson_model import LessonType
from app.schemas.auth_schema import UserPublic


class CreateLessonRequest(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=500)]
    type: LessonType
    video_url: str | None = None
    file_url: str | None = None
    duration_seconds: int = 0
    allow_download: bool = False
    description: Annotated[str | None, Field(None, max_length=3000)] = None
    responsible_user_id: UUID | None = None

    @field_validator("description")
    @classmethod
    def strip_desc(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        return s or None


class UpdateLessonRequest(BaseModel):
    title: Annotated[str | None, Field(None, min_length=1, max_length=500)] = None
    type: LessonType | None = None
    video_url: str | None = None
    file_url: str | None = None
    duration_seconds: int | None = None
    allow_download: bool | None = None
    description: Annotated[str | None, Field(None, max_length=3000)] = None
    responsible_user_id: UUID | None = None

    @field_validator("description")
    @classmethod
    def strip_desc(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        return s or None


class AttachmentItem(BaseModel):
    id: UUID
    type: AttachmentType
    url: str
    label: str


class CreateAttachmentRequest(BaseModel):
    type: AttachmentType
    url: Annotated[str, Field(min_length=1, max_length=1000)]
    label: Annotated[str, Field(min_length=1, max_length=255)]


class LessonItem(BaseModel):
    id: UUID
    title: str
    type: LessonType
    video_url: str | None
    file_url: str | None
    duration_seconds: int
    allow_download: bool
    description: str | None
    sort_order: int
    responsible_user: UserPublic | None
    attachments: list[AttachmentItem]


class LessonsListResponse(BaseModel):
    data: list[LessonItem]


class LessonItemEnvelope(BaseModel):
    data: LessonItem


class AttachmentItemEnvelope(BaseModel):
    data: AttachmentItem


class ReorderLessonsRequest(BaseModel):
    lesson_ids: list[UUID]
