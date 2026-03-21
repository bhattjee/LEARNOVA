"""
security.py — JWT creation/verification and bcrypt password hashing utilities.
All authentication logic flows through these helpers.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from fastapi import HTTPException, status
from jose import JWTError, jwt

from app.core.config import settings

BCRYPT_ROUNDS = 12


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Encode a signed JWT access token with optional custom expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    to_encode["exp"] = expire
    to_encode["iat"] = datetime.now(timezone.utc)
    return jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def verify_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT; raise 401 if invalid or expired."""
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from exc


def hash_password(plain: str) -> str:
    """Hash a plaintext password with bcrypt."""
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain.encode("utf-8"),
            hashed.encode("utf-8"),
        )
    except ValueError:
        return False
