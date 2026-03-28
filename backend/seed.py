"""
seed.py — Creates 3 test users for development. Run once after migration.

Usage (from backend/): python seed.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user_model import User, UserRole


SEED_USERS: list[tuple[str, str, UserRole, str]] = [
    ("admin@learnova.com", "Admin123!", UserRole.ADMIN, "Rajesh Kapoor"),
    (
        "instructor@learnova.com",
        "Instructor123!",
        UserRole.INSTRUCTOR,
        "Meera Krishnan",
    ),
    ("learner@learnova.com", "Learner123!", UserRole.LEARNER, "Rohan Mehta"),
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        for email, password, role, full_name in SEED_USERS:
            email_lower = email.lower()
            exists = await session.scalar(
                select(User.id).where(
                    func.lower(User.email) == email_lower,
                    User.deleted_at.is_(None),
                ),
            )
            if exists is not None:
                continue
            session.add(
                User(
                    email=email_lower,
                    password_hash=hash_password(password),
                    full_name=full_name,
                    role=role,
                ),
            )
        await session.commit()
    print("Seed complete")


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
