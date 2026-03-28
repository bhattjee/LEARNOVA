"""
Remove all rows created by seed_bulk.py (bulk learners, bulk-tagged courses, related data).

Run from backend/:  python cleanup_bulk_seed.py

Does not delete standard seed users from seed.py (admin@, instructor@, learner@learnova.com).
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from sqlalchemy import delete, or_, select

from app.core.constants import BULK_SEED_TAG
from app.core.database import AsyncSessionLocal
from app.models.course_model import Course
from app.models.enrollment_model import Enrollment
from app.models.lesson_model import Lesson
from app.models.lesson_progress_model import LessonProgress
from app.models.quiz_model import Question, QuestionOption, Quiz, QuizAttempt
from app.models.review_model import Review
from app.models.attachment_model import LessonAttachment
from app.models.user_model import User


async def cleanup_bulk_seed() -> None:
    async with AsyncSessionLocal() as session:
        bulk_course_ids = list(
            (
                await session.scalars(
                    select(Course.id).where(
                        Course.deleted_at.is_(None),
                        or_(
                            Course.tags.contains([BULK_SEED_TAG]),
                            Course.slug.like("bulk-course-%"),
                        ),
                    ),
                )
            ).all(),
        )

        bulk_user_ids = list(
            (
                await session.scalars(
                    select(User.id).where(
                        User.deleted_at.is_(None),
                        or_(
                            User.email.like("bulk-learner-%"),
                            User.email == "bulk-instructor@learnova.local",
                        ),
                    ),
                )
            ).all(),
        )

        if not bulk_course_ids and not bulk_user_ids:
            print("No bulk seed data found (no bulk courses or bulk users).")
            return

        quiz_ids_q = select(Quiz.id).where(Quiz.course_id.in_(bulk_course_ids))
        lesson_ids_q = select(Lesson.id).where(Lesson.course_id.in_(bulk_course_ids))

        en_conds = []
        if bulk_course_ids:
            en_conds.append(Enrollment.course_id.in_(bulk_course_ids))
        if bulk_user_ids:
            en_conds.append(Enrollment.user_id.in_(bulk_user_ids))
        enrollment_ids = list(
            (await session.scalars(select(Enrollment.id).where(or_(*en_conds)))).all(),
        )

        # 1) Quiz attempts (answers removed via ON DELETE CASCADE on attempts)
        attempt_parts = []
        if bulk_user_ids:
            attempt_parts.append(QuizAttempt.user_id.in_(bulk_user_ids))
        if bulk_course_ids:
            attempt_parts.append(QuizAttempt.quiz_id.in_(quiz_ids_q))
        if attempt_parts:
            await session.execute(delete(QuizAttempt).where(or_(*attempt_parts)))

        # 2) Lesson progress
        lp_parts = []
        if enrollment_ids:
            lp_parts.append(LessonProgress.enrollment_id.in_(enrollment_ids))
        if bulk_course_ids:
            lp_parts.append(LessonProgress.lesson_id.in_(lesson_ids_q))
        if lp_parts:
            await session.execute(delete(LessonProgress).where(or_(*lp_parts)))

        # 3) Reviews
        rev_parts = []
        if bulk_course_ids:
            rev_parts.append(Review.course_id.in_(bulk_course_ids))
        if bulk_user_ids:
            rev_parts.append(Review.user_id.in_(bulk_user_ids))
        if rev_parts:
            await session.execute(delete(Review).where(or_(*rev_parts)))

        # 4) Enrollments
        if en_conds:
            await session.execute(delete(Enrollment).where(or_(*en_conds)))

        # 5) Lesson attachments
        if bulk_course_ids:
            await session.execute(delete(LessonAttachment).where(LessonAttachment.lesson_id.in_(lesson_ids_q)))

        # 6) Questions / options
        if bulk_course_ids:
            q_ids = list(
                (await session.scalars(select(Question.id).where(Question.quiz_id.in_(quiz_ids_q)))).all(),
            )
            if q_ids:
                await session.execute(delete(QuestionOption).where(QuestionOption.question_id.in_(q_ids)))
                await session.execute(delete(Question).where(Question.id.in_(q_ids)))

        # 7) Lessons
        if bulk_course_ids:
            await session.execute(delete(Lesson).where(Lesson.course_id.in_(bulk_course_ids)))

        # 8) Quizzes
        if bulk_course_ids:
            await session.execute(delete(Quiz).where(Quiz.course_id.in_(bulk_course_ids)))

        # 9) Courses
        if bulk_course_ids:
            await session.execute(delete(Course).where(Course.id.in_(bulk_course_ids)))

        # 10) Bulk-only users
        if bulk_user_ids:
            await session.execute(delete(User).where(User.id.in_(bulk_user_ids)))

        await session.commit()

    print(
        f"Cleanup complete. Removed bulk courses: {len(bulk_course_ids)}, "
        f"bulk users: {len(bulk_user_ids)}.",
    )


def main() -> None:
    asyncio.run(cleanup_bulk_seed())


if __name__ == "__main__":
    main()
