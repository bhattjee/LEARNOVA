"""
lessons.py — Lesson and attachment APIs (nested under courses where noted).
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user_model import User, UserRole
from app.schemas.lesson_schema import (
    AttachmentItemEnvelope,
    CreateAttachmentRequest,
    CreateLessonRequest,
    LessonItemEnvelope,
    LessonsListResponse,
    ReorderLessonsRequest,
    UpdateLessonRequest,
)
from app.services.lesson_service import (
    add_attachment,
    create_lesson,
    delete_attachment,
    delete_lesson,
    get_lesson_by_id,
    get_lessons_for_course,
    reorder_lessons,
    update_lesson,
)

router = APIRouter()

StaffUser = Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))]


@router.put("/courses/{course_id}/lessons/reorder", response_model=LessonsListResponse)
async def reorder_lessons_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: ReorderLessonsRequest,
) -> LessonsListResponse:
    items = await reorder_lessons(db, course_id, current_user, body)
    return LessonsListResponse(data=items)


@router.get("/courses/{course_id}/lessons", response_model=LessonsListResponse)
async def list_lessons_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LessonsListResponse:
    items = await get_lessons_for_course(db, course_id, current_user)
    return LessonsListResponse(data=items)


@router.post(
    "/courses/{course_id}/lessons",
    response_model=LessonItemEnvelope,
    status_code=status.HTTP_201_CREATED,
)
async def create_lesson_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: CreateLessonRequest,
) -> LessonItemEnvelope:
    item = await create_lesson(db, course_id, current_user, body)
    return LessonItemEnvelope(data=item)


@router.get("/lessons/{lesson_id}", response_model=LessonItemEnvelope)
async def get_lesson_route(
    lesson_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LessonItemEnvelope:
    item = await get_lesson_by_id(db, lesson_id, current_user)
    return LessonItemEnvelope(data=item)


@router.put("/lessons/{lesson_id}", response_model=LessonItemEnvelope)
async def update_lesson_route(
    lesson_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: UpdateLessonRequest,
) -> LessonItemEnvelope:
    item = await update_lesson(db, lesson_id, current_user, body)
    return LessonItemEnvelope(data=item)


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson_route(
    lesson_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await delete_lesson(db, lesson_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/lessons/{lesson_id}/attachments",
    response_model=AttachmentItemEnvelope,
    status_code=status.HTTP_201_CREATED,
)
async def add_attachment_route(
    lesson_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: CreateAttachmentRequest,
) -> AttachmentItemEnvelope:
    item = await add_attachment(db, lesson_id, current_user, body)
    return AttachmentItemEnvelope(data=item)


@router.delete(
    "/lessons/{lesson_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_attachment_route(
    lesson_id: UUID,
    attachment_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await delete_attachment(db, lesson_id, attachment_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
