"""
reporting.py — API routes for the reporting dashboard.
"""

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user_model import User, UserRole
from app.schemas.reporting_schema import ReportingResponse
from app.services.reporting_service import get_reporting_data

router = APIRouter()

StaffUser = Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))]

StatusQuery = Literal["all", "not_started", "in_progress", "completed"]


@router.get("/reporting", response_model=ReportingResponse)
async def get_reporting_route(
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Annotated[StatusQuery, Query(description="Row filter")] = "all",
    course_id: UUID | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ReportingResponse:
    return await get_reporting_data(db, current_user, status, course_id, page, limit)
