"""
auth.py — API routes for user registration, login, and profile.
All routes are under the /api/v1/auth prefix.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.limiter import limiter
from app.models.user_model import User
from app.schemas.auth_schema import (
    LoginRequest,
    RegisterRequest,
    TokenDataEnvelope,
    UserDataEnvelope,
)
from app.core.dependencies import get_current_user
from app.services.auth_service import (
    get_current_user_profile,
    login_user,
    register_user,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenDataEnvelope,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenDataEnvelope:
    """Register a new user and return a JWT."""
    token = await register_user(db, body)
    return TokenDataEnvelope(data=token)


@router.post("/login", response_model=TokenDataEnvelope)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenDataEnvelope:
    """Issue a JWT for valid credentials."""
    token = await login_user(db, body)
    return TokenDataEnvelope(data=token)


@router.get("/me", response_model=UserDataEnvelope)
async def me(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserDataEnvelope:
    """Return the authenticated user's profile."""
    public = await get_current_user_profile(db, current_user.id)
    return UserDataEnvelope(data=public)
