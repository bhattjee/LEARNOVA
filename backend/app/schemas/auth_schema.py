"""
auth_schema.py — Pydantic schemas for authentication request and response payloads.
"""

import re
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.allowed_email_domains import signup_email_domain_allowed
from app.models.user_model import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8)]
    full_name: Annotated[str, Field(min_length=1, max_length=255)]
    role: UserRole = UserRole.LEARNER

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if len(value) < 8:
            msg = "Password must be at least 8 characters long."
            raise ValueError(msg)
        if not re.search(r"[a-z]", value):
            msg = "Password must include at least one lowercase letter."
            raise ValueError(msg)
        if not re.search(r"[A-Z]", value):
            msg = "Password must include at least one uppercase letter."
            raise ValueError(msg)
        if not re.search(r"[0-9]", value):
            msg = "Password must include at least one number."
            raise ValueError(msg)
        return value

    @field_validator("full_name")
    @classmethod
    def strip_full_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            msg = "Full name cannot be empty"
            raise ValueError(msg)
        return stripped

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("email")
    @classmethod
    def email_domain_allowed(cls, value: str) -> str:
        if not signup_email_domain_allowed(value):
            msg = (
                "Please use an email from a supported provider "
                "(e.g. Gmail, Outlook, or Yahoo)."
            )
            raise ValueError(msg)
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserPublic(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    email: str
    full_name: str
    role: UserRole
    avatar_url: str | None
    total_points: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class TokenDataEnvelope(BaseModel):
    """Standard success wrapper for auth token payloads."""

    data: TokenResponse


class UserDataEnvelope(BaseModel):
    """Standard success wrapper for a single user."""

    data: UserPublic


# Alias for documentation parity with spec ("MeResponse").
MeResponse = UserPublic
