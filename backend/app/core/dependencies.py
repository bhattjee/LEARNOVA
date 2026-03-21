"""
dependencies.py — FastAPI dependency injection: current user extraction from JWT,
role enforcement helpers.
"""

from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user_model import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
optional_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Load the active user row from a valid Bearer JWT."""
    payload = verify_token(token)
    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    try:
        user_id = UUID(str(sub))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user id in token",
        ) from exc

    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None)),
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def get_optional_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(optional_bearer),
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    """Return the current user if a valid Bearer token is sent; otherwise None."""
    if credentials is None or not credentials.credentials:
        return None
    try:
        payload = verify_token(credentials.credentials)
    except HTTPException:
        return None
    sub = payload.get("sub")
    if sub is None:
        return None
    try:
        user_id = UUID(str(sub))
    except ValueError:
        return None
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None)),
    )
    return result.scalar_one_or_none()


def require_roles(*allowed_roles: UserRole) -> Callable[..., User]:
    """Factory returning a dependency that enforces role membership."""

    allowed_values = {role.value for role in allowed_roles}

    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role.value not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker
