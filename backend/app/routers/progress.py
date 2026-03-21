"""
progress.py — API routes for tracking lesson progress on the learner side.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user_model import User, UserRole
from app.schemas.lesson_schema import LessonItemEnvelope
from app.schemas.progress_schema import (
    CompleteLessonEnvelope,
    CompleteLessonRequest,
    StartLessonEnvelope,
    StartLessonRequest,
)
from app.services.progress_service import complete_lesson, get_player_lesson, start_lesson

router = APIRouter()

LearnerUser = Annotated[User, Depends(require_roles(UserRole.LEARNER))]


@router.post("/start", response_model=StartLessonEnvelope)
async def start_lesson_route(
    body: StartLessonRequest,
    current_user: LearnerUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> StartLessonEnvelope:
    data = await start_lesson(db, current_user, body.lesson_id, body.course_id)
    return StartLessonEnvelope(data=data)


@router.post("/complete", response_model=CompleteLessonEnvelope)
async def complete_lesson_route(
    body: CompleteLessonRequest,
    current_user: LearnerUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CompleteLessonEnvelope:
    data = await complete_lesson(
        db,
        current_user,
        body.lesson_id,
        body.course_id,
        body.time_spent_seconds,
    )
    return CompleteLessonEnvelope(data=data)


@router.get(
    "/courses/{course_id}/lessons/{lesson_id}/player",
    response_model=LessonItemEnvelope,
)
async def get_player_lesson_route(
    course_id: UUID,
    lesson_id: UUID,
    current_user: LearnerUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LessonItemEnvelope:
    item = await get_player_lesson(db, current_user, course_id, lesson_id)
    return LessonItemEnvelope(data=item)
