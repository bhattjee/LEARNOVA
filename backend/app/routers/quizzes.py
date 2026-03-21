"""
quizzes.py — API routes for quiz builder (instructor-facing).
All routes require admin or instructor role.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user_model import User, UserRole
from app.schemas.quiz_schema import (
    CreateQuizRequest,
    QuizDetailEnvelope,
    QuizItemEnvelope,
    QuizzesListResponse,
    SaveQuestionsRequest,
    UpdateQuizRequest,
)
from app.services.quiz_service import (
    create_quiz,
    delete_quiz,
    get_quiz_detail,
    get_quizzes_for_course,
    save_questions,
    update_quiz,
)

router = APIRouter()

StaffUser = Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))]


@router.get("/courses/{course_id}/quizzes", response_model=QuizzesListResponse)
async def list_quizzes_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> QuizzesListResponse:
    items = await get_quizzes_for_course(db, course_id, current_user)
    return QuizzesListResponse(data=items)


@router.post(
    "/courses/{course_id}/quizzes",
    response_model=QuizItemEnvelope,
    status_code=status.HTTP_201_CREATED,
)
async def create_quiz_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: CreateQuizRequest,
) -> QuizItemEnvelope:
    item = await create_quiz(db, course_id, current_user, body)
    return QuizItemEnvelope(data=item)


@router.get("/quizzes/{quiz_id}", response_model=QuizDetailEnvelope)
async def get_quiz_route(
    quiz_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> QuizDetailEnvelope:
    detail = await get_quiz_detail(db, quiz_id, current_user)
    return QuizDetailEnvelope(data=detail)


@router.put("/quizzes/{quiz_id}", response_model=QuizDetailEnvelope)
async def update_quiz_route(
    quiz_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: UpdateQuizRequest,
) -> QuizDetailEnvelope:
    detail = await update_quiz(db, quiz_id, current_user, body)
    return QuizDetailEnvelope(data=detail)


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz_route(
    quiz_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await delete_quiz(db, quiz_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/quizzes/{quiz_id}/questions", response_model=QuizDetailEnvelope)
async def save_questions_route(
    quiz_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: SaveQuestionsRequest,
) -> QuizDetailEnvelope:
    detail = await save_questions(db, quiz_id, current_user, body)
    return QuizDetailEnvelope(data=detail)
