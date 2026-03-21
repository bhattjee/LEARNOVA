"""
auth_service.py — Business logic for user registration, login, and profile retrieval.
All authentication operations go through this service.
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user_model import User, UserRole
from app.schemas.auth_schema import LoginRequest, RegisterRequest, TokenResponse, UserPublic


def _to_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        avatar_url=user.avatar_url,
        total_points=user.total_points,
    )


def _build_token_response(user: User) -> TokenResponse:
    token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        },
    )
    return TokenResponse(access_token=token, token_type="bearer", user=_to_public(user))


async def register_user(db: AsyncSession, data: RegisterRequest) -> TokenResponse:
    """Create a user after checking email uniqueness (case-insensitive)."""
    email_lower = data.email.lower()
    existing = await db.scalar(
        select(User.id).where(
            func.lower(User.email) == email_lower,
            User.deleted_at.is_(None),
        ),
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    if data.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin registration is not allowed",
        )

    user = User(
        email=email_lower,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return _build_token_response(user)


async def login_user(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    """Authenticate by email and password; generic error on failure."""
    email_lower = data.email.lower()
    result = await db.execute(
        select(User).where(
            func.lower(User.email) == email_lower,
            User.deleted_at.is_(None),
        ),
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return _build_token_response(user)


async def get_current_user_profile(db: AsyncSession, user_id: UUID) -> UserPublic:
    """Load a non-deleted user and return the public projection."""
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None)),
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return _to_public(user)
