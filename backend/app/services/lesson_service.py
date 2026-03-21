"""
lesson_service.py — Lessons and attachments scoped to courses (staff only).
"""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attachment_model import LessonAttachment
from app.models.lesson_model import Lesson, LessonType
from app.models.user_model import User
from app.schemas.auth_schema import UserPublic
from app.schemas.lesson_schema import (
    AttachmentItem,
    CreateAttachmentRequest,
    CreateLessonRequest,
    LessonItem,
    ReorderLessonsRequest,
    UpdateLessonRequest,
)
from app.services.course_service import _load_course_for_staff


async def _responsible_public(db: AsyncSession, user_id: uuid.UUID | None) -> UserPublic | None:
    if user_id is None:
        return None
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None)),
    )
    u = result.scalar_one_or_none()
    return UserPublic.model_validate(u) if u else None


def _active_attachments(lesson: Lesson) -> list[LessonAttachment]:
    return [a for a in lesson.attachments if a.deleted_at is None]


async def lesson_to_item(db: AsyncSession, lesson: Lesson) -> LessonItem:
    ru = await _responsible_public(db, lesson.responsible_user_id)
    atts = [
        AttachmentItem(id=a.id, type=a.type, url=a.url, label=a.label)
        for a in _active_attachments(lesson)
    ]
    return LessonItem(
        id=lesson.id,
        title=lesson.title,
        type=lesson.type,
        video_url=lesson.video_url,
        file_url=lesson.file_url,
        duration_seconds=lesson.duration_seconds,
        allow_download=lesson.allow_download,
        description=lesson.description,
        sort_order=lesson.sort_order,
        responsible_user=ru,
        attachments=atts,
    )


async def _get_lesson_loaded(
    db: AsyncSession,
    lesson_id: uuid.UUID,
) -> Lesson | None:
    result = await db.execute(
        select(Lesson)
        .options(selectinload(Lesson.attachments))
        .where(Lesson.id == lesson_id, Lesson.deleted_at.is_(None)),
    )
    return result.scalar_one_or_none()


async def _assert_lesson_course_access(
    db: AsyncSession,
    lesson: Lesson,
    user: User,
) -> None:
    course = await _load_course_for_staff(db, lesson.course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )


async def get_lessons_for_course(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
) -> list[LessonItem]:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    result = await db.execute(
        select(Lesson)
        .options(selectinload(Lesson.attachments))
        .where(Lesson.course_id == course_id, Lesson.deleted_at.is_(None))
        .order_by(Lesson.sort_order, Lesson.created_at),
    )
    lessons = result.scalars().unique().all()
    items: list[LessonItem] = []
    for les in lessons:
        items.append(await lesson_to_item(db, les))
    return items


async def create_lesson(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
    data: CreateLessonRequest,
) -> LessonItem:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    max_ord = await db.scalar(
        select(func.coalesce(func.max(Lesson.sort_order), -1)).where(
            Lesson.course_id == course_id,
            Lesson.deleted_at.is_(None),
        ),
    )
    next_order = int(max_ord) + 1
    lesson = Lesson(
        course_id=course_id,
        title=data.title.strip(),
        type=data.type,
        video_url=data.video_url.strip() if data.video_url else None,
        file_url=data.file_url.strip() if data.file_url else None,
        duration_seconds=max(0, data.duration_seconds),
        allow_download=data.allow_download,
        description=data.description,
        sort_order=next_order,
        responsible_user_id=data.responsible_user_id,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    loaded = await _get_lesson_loaded(db, lesson.id)
    assert loaded is not None
    return await lesson_to_item(db, loaded)


async def get_lesson_by_id(
    db: AsyncSession,
    lesson_id: uuid.UUID,
    user: User,
) -> LessonItem:
    lesson = await _get_lesson_loaded(db, lesson_id)
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    await _assert_lesson_course_access(db, lesson, user)
    return await lesson_to_item(db, lesson)


async def update_lesson(
    db: AsyncSession,
    lesson_id: uuid.UUID,
    user: User,
    data: UpdateLessonRequest,
) -> LessonItem:
    lesson = await _get_lesson_loaded(db, lesson_id)
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    await _assert_lesson_course_access(db, lesson, user)
    payload = data.model_dump(exclude_unset=True)
    if "title" in payload and payload["title"] is not None:
        lesson.title = payload["title"].strip()
    if "type" in payload and payload["type"] is not None:
        lesson.type = payload["type"]
    if "video_url" in payload:
        v = payload["video_url"]
        lesson.video_url = v.strip() if v else None
    if "file_url" in payload:
        v = payload["file_url"]
        lesson.file_url = v.strip() if v else None
    if "duration_seconds" in payload and payload["duration_seconds"] is not None:
        lesson.duration_seconds = max(0, int(payload["duration_seconds"]))
    if "allow_download" in payload and payload["allow_download"] is not None:
        lesson.allow_download = payload["allow_download"]
    if "description" in payload:
        lesson.description = payload["description"]
    if "responsible_user_id" in payload:
        lesson.responsible_user_id = payload["responsible_user_id"]
    await db.commit()
    await db.refresh(lesson)
    loaded = await _get_lesson_loaded(db, lesson.id)
    assert loaded is not None
    return await lesson_to_item(db, loaded)


async def delete_lesson(
    db: AsyncSession,
    lesson_id: uuid.UUID,
    user: User,
) -> None:
    lesson = await _get_lesson_loaded(db, lesson_id)
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    await _assert_lesson_course_access(db, lesson, user)
    lesson.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def reorder_lessons(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
    body: ReorderLessonsRequest,
) -> list[LessonItem]:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    result = await db.execute(
        select(Lesson.id).where(Lesson.course_id == course_id, Lesson.deleted_at.is_(None)),
    )
    existing = {row[0] for row in result.all()}
    incoming = list(body.lesson_ids)
    if set(incoming) != existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="lesson_ids must list every lesson in the course exactly once",
        )
    for idx, lid in enumerate(incoming):
        r = await db.execute(
            select(Lesson).where(
                Lesson.id == lid,
                Lesson.course_id == course_id,
                Lesson.deleted_at.is_(None),
            ),
        )
        les = r.scalar_one_or_none()
        if les is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid lesson id in reorder list",
            )
        les.sort_order = idx
    await db.commit()
    return await get_lessons_for_course(db, course_id, user)


async def add_attachment(
    db: AsyncSession,
    lesson_id: uuid.UUID,
    user: User,
    data: CreateAttachmentRequest,
) -> AttachmentItem:
    lesson = await _get_lesson_loaded(db, lesson_id)
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    await _assert_lesson_course_access(db, lesson, user)
    att = LessonAttachment(
        lesson_id=lesson_id,
        type=data.type,
        url=data.url.strip(),
        label=data.label.strip(),
    )
    db.add(att)
    await db.commit()
    await db.refresh(att)
    return AttachmentItem(id=att.id, type=att.type, url=att.url, label=att.label)


async def delete_attachment(
    db: AsyncSession,
    lesson_id: uuid.UUID,
    attachment_id: uuid.UUID,
    user: User,
) -> None:
    lesson = await _get_lesson_loaded(db, lesson_id)
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    await _assert_lesson_course_access(db, lesson, user)
    result = await db.execute(
        select(LessonAttachment).where(
            LessonAttachment.id == attachment_id,
            LessonAttachment.lesson_id == lesson_id,
            LessonAttachment.deleted_at.is_(None),
        ),
    )
    att = result.scalar_one_or_none()
    if att is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )
    att.deleted_at = datetime.now(timezone.utc)
    await db.commit()
