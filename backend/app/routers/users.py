"""
users.py — User management routes for admin/instructor tools.
Exposes staff list for fields such as course responsible person.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user_model import User, UserRole
from app.schemas.course_schema import UsersListResponse
from app.services.user_service import list_staff_directory

router = APIRouter()

StaffUser = Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))]


@router.get("", response_model=UsersListResponse)
async def list_users(
    _current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UsersListResponse:
    users = await list_staff_directory(db)
    return UsersListResponse(data=users)
