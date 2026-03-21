"""
user_service.py — User listing for admin/instructor workflows.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_model import User, UserRole
from app.schemas.auth_schema import UserPublic


async def list_staff_directory(db: AsyncSession) -> list[UserPublic]:
    """Return active admins and instructors for dropdowns (e.g. course responsible)."""
    result = await db.execute(
        select(User)
        .where(
            User.deleted_at.is_(None),
            User.role.in_((UserRole.ADMIN, UserRole.INSTRUCTOR)),
        )
        .order_by(User.full_name),
    )
    users = result.scalars().all()
    return [UserPublic.model_validate(u) for u in users]
