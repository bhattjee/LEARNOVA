"""
user_model.py — Authenticated user representation from JWT claims (Phase 0).
Replaced or extended with a SQLAlchemy `User` row in Phase 1.
"""

from dataclasses import dataclass
from uuid import UUID


@dataclass(slots=True, frozen=True)
class UserModel:
    """User identity derived from a valid access token (no DB lookup in Phase 0)."""

    id: UUID
    email: str
    role: str
