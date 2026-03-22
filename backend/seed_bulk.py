"""
seed_bulk.py — Inserts ~300 rows per core module for load/dev testing.

Prerequisites: migrations applied (`alembic upgrade head`), `.env` configured.
Recommended: run `python seed.py` first so admin/instructor/learner exist.

Usage (from backend/): python seed_bulk.py

Idempotent: skips if 300+ bulk learners already exist (email bulk-learner-*@learnova.local).
"""

from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.attachment_model import AttachmentType, LessonAttachment
from app.models.course_model import Course, CourseAccessRule, CourseVisibility
from app.models.enrollment_model import Enrollment, EnrollmentStatus
from app.models.lesson_model import Lesson, LessonType
from app.models.lesson_progress_model import LessonProgress
from app.models.quiz_model import Question, QuestionOption, Quiz
from app.models.review_model import Review
from app.models.user_model import User, UserRole

BULK_COUNT = 300
BATCH_SIZE = 50
BULK_LEARNER_DOMAIN = "learnova.local"
BULK_PASSWORD = "Learner123!"
BULK_TAG = "bulk-seed"


async def _ensure_staff_user(session) -> uuid.UUID:
    uid = await session.scalar(
        select(User.id)
        .where(
            User.role == UserRole.INSTRUCTOR,
            User.deleted_at.is_(None),
        )
        .limit(1),
    )
    if uid is not None:
        return uid
    uid = await session.scalar(
        select(User.id)
        .where(
            User.role == UserRole.ADMIN,
            User.deleted_at.is_(None),
        )
        .limit(1),
    )
    if uid is not None:
        return uid
    u = User(
        email="bulk-instructor@learnova.local",
        password_hash=hash_password("Instructor123!"),
        full_name="Bulk Seed Instructor",
        role=UserRole.INSTRUCTOR,
    )
    session.add(u)
    await session.commit()
    await session.refresh(u)
    return u.id


async def seed_bulk() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.scalar(
            select(func.count())
            .select_from(User)
            .where(
                User.email.like("bulk-learner-%"),
                User.deleted_at.is_(None),
            ),
        )
        if (existing or 0) >= BULK_COUNT:
            print("Bulk seed already applied (bulk learners present). Skipping.")
            return

        staff_id = await _ensure_staff_user(session)

        pwd_hash = hash_password(BULK_PASSWORD)
        learners: list[User] = []
        for i in range(BULK_COUNT):
            email = f"bulk-learner-{i:04d}@{BULK_LEARNER_DOMAIN}"
            learners.append(
                User(
                    email=email,
                    password_hash=pwd_hash,
                    full_name=f"Bulk Learner {i:04d}",
                    role=UserRole.LEARNER,
                ),
            )
            session.add(learners[-1])
            if len(learners) % BATCH_SIZE == 0:
                await session.commit()

        if len(learners) % BATCH_SIZE != 0:
            await session.commit()

        courses: list[Course] = []
        for i in range(BULK_COUNT):
            slug = f"bulk-course-{i:04d}-{uuid.uuid4().hex[:10]}"
            c = Course(
                title=f"Bulk seed course {i:04d}",
                slug=slug,
                tags=[BULK_TAG, f"topic-{i % 20}"],
                description=f"Auto-generated course {i} for reporting and catalog tests.",
                is_published=True,
                visibility=CourseVisibility.EVERYONE,
                access_rule=CourseAccessRule.OPEN,
                price_cents=0,
                created_by=staff_id,
                responsible_user_id=staff_id,
            )
            session.add(c)
            courses.append(c)
            if len(courses) % BATCH_SIZE == 0:
                await session.commit()
        if len(courses) % BATCH_SIZE != 0:
            await session.commit()

        quizzes: list[Quiz] = []
        for i, c in enumerate(courses):
            q = Quiz(
                course_id=c.id,
                title=f"Bulk quiz — course {i:04d}",
            )
            session.add(q)
            quizzes.append(q)
            if len(quizzes) % BATCH_SIZE == 0:
                await session.commit()
        if len(quizzes) % BATCH_SIZE != 0:
            await session.commit()

        video_lessons: list[Lesson] = []
        quiz_lessons: list[Lesson] = []
        for i, c in enumerate(courses):
            vid = Lesson(
                course_id=c.id,
                title=f"Intro video — course {i:04d}",
                type=LessonType.VIDEO,
                video_url="https://example.com/seed-video.mp4",
                duration_seconds=120,
                sort_order=0,
                responsible_user_id=staff_id,
            )
            session.add(vid)
            video_lessons.append(vid)
            ql = Lesson(
                course_id=c.id,
                title=f"Knowledge check — course {i:04d}",
                type=LessonType.QUIZ,
                quiz_id=quizzes[i].id,
                sort_order=1,
                responsible_user_id=staff_id,
            )
            session.add(ql)
            quiz_lessons.append(ql)
            if len(video_lessons) % BATCH_SIZE == 0:
                await session.commit()
        if len(video_lessons) % BATCH_SIZE != 0:
            await session.commit()

        for idx, qz in enumerate(quizzes):
            qu = Question(
                quiz_id=qz.id,
                text=f"Bulk seed question for quiz {idx:04d}?",
                sort_order=0,
            )
            session.add(qu)
            await session.flush()
            session.add(
                QuestionOption(
                    question_id=qu.id,
                    text="Correct answer",
                    is_correct=True,
                    sort_order=0,
                ),
            )
            session.add(
                QuestionOption(
                    question_id=qu.id,
                    text="Incorrect answer",
                    is_correct=False,
                    sort_order=1,
                ),
            )
            if (idx + 1) % BATCH_SIZE == 0:
                await session.commit()
        if BULK_COUNT % BATCH_SIZE != 0:
            await session.commit()

        enrollments: list[Enrollment] = []
        for i in range(BULK_COUNT):
            e = Enrollment(
                user_id=learners[i].id,
                course_id=courses[i].id,
                enrolled_by=staff_id,
                status=EnrollmentStatus.IN_PROGRESS,
            )
            session.add(e)
            enrollments.append(e)
            if len(enrollments) % BATCH_SIZE == 0:
                await session.commit()
        if len(enrollments) % BATCH_SIZE != 0:
            await session.commit()

        now = datetime.now(timezone.utc)
        for i in range(BULK_COUNT):
            session.add(
                LessonProgress(
                    enrollment_id=enrollments[i].id,
                    lesson_id=video_lessons[i].id,
                    time_spent_seconds=60,
                    completed_at=now,
                ),
            )
            if (i + 1) % BATCH_SIZE == 0:
                await session.commit()
        if BULK_COUNT % BATCH_SIZE != 0:
            await session.commit()

        for i in range(BULK_COUNT):
            session.add(
                Review(
                    user_id=learners[i].id,
                    course_id=courses[i].id,
                    rating=3 + (i % 3),
                    comment=f"Bulk seed review {i:04d}",
                ),
            )
            if (i + 1) % BATCH_SIZE == 0:
                await session.commit()
        if BULK_COUNT % BATCH_SIZE != 0:
            await session.commit()

        for i in range(BULK_COUNT):
            session.add(
                LessonAttachment(
                    lesson_id=video_lessons[i].id,
                    type=AttachmentType.LINK,
                    url="https://example.com/seed-resource",
                    label=f"Resource {i:04d}",
                ),
            )
            if (i + 1) % BATCH_SIZE == 0:
                await session.commit()
        if BULK_COUNT % BATCH_SIZE != 0:
            await session.commit()

        await session.commit()

    print(
        f"Bulk seed complete: {BULK_COUNT} learners, courses, quizzes, "
        f"{BULK_COUNT * 2} lessons (video+quiz), {BULK_COUNT} questions (2 options each), "
        f"enrollments, lesson_progress, reviews, attachments.",
    )


def main() -> None:
    asyncio.run(seed_bulk())


if __name__ == "__main__":
    main()
