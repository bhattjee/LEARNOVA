"""
dependencies.py — FastAPI dependency injection: current user extraction from JWT,
role enforcement helpers.
"""

from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import verify_token
from app.models.user_model import UserModel

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> UserModel:
    """Resolve the current user from a Bearer JWT (payload only in Phase 0)."""
    payload = verify_token(token)
    sub = payload.get("sub")
    email = payload.get("email")
    role = payload.get("role")
    if sub is None or email is None or role is None:
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
    return UserModel(id=user_id, email=str(email), role=str(role))


def require_roles(*allowed_roles: str) -> Callable[..., UserModel]:
    """Factory returning a dependency that enforces role membership."""

    async def role_checker(
        current_user: Annotated[UserModel, Depends(get_current_user)],
    ) -> UserModel:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker
