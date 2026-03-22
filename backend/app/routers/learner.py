"""
learner.py — Learner-facing API routes (enrolled courses, etc.).
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user_model import User, UserRole
from app.schemas.course_schema import LearnerCoursesListResponse
from app.services.course_service import get_my_courses

router = APIRouter()

AnyUser = Annotated[
    User, Depends(require_roles(UserRole.LEARNER, UserRole.ADMIN, UserRole.INSTRUCTOR))
]


@router.get("/my-courses", response_model=LearnerCoursesListResponse)
async def list_my_courses_route(
    current_user: AnyUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LearnerCoursesListResponse:
    items = await get_my_courses(db, current_user)
    return LearnerCoursesListResponse(data=items)
