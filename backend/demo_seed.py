"""
Full demo reset + seed — wipes application data and loads realistic multi-role mock data.

- Indian names, varied course view counts, gamification points per learner
- Primary learner (learner@) ~69% average course completion via lesson progress
- Populates catalog, my courses, reporting, reviews, attachments

Usage (from backend/):  python demo_seed.py

Requires: migrations applied, `.env` with DATABASE_URL.
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID

_BACKEND = Path(__file__).resolve().parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from sqlalchemy import select, text

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

SHOWCASE_TAG = "showcase"
PW_ADMIN = "Admin123!"
PW_STAFF = "Instructor123!"
PW_LEARNER = "Learner123!"


def _spec(
    title: str,
    slug: str,
    tags: list[str],
    description: str,
    website: str,
    cover: str,
    views: int,
    published: bool,
) -> dict[str, Any]:
    return {
        "title": title,
        "slug": slug,
        "tags": tags + [SHOWCASE_TAG],
        "description": description,
        "website": website,
        "cover_image_url": cover,
        "views_count": views,
        "is_published": published,
    }


async def reset_and_seed() -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE users RESTART IDENTITY CASCADE"))
        await session.commit()

    async with AsyncSessionLocal() as session:
        admin = User(
            email="admin@learnova.com",
            password_hash=hash_password(PW_ADMIN),
            full_name="Rajesh Kapoor",
            role=UserRole.ADMIN,
            total_points=0,
        )
        inst_meera = User(
            email="instructor@learnova.com",
            password_hash=hash_password(PW_STAFF),
            full_name="Meera Krishnan",
            role=UserRole.INSTRUCTOR,
            total_points=0,
        )
        inst_aditya = User(
            email="aditya.nair@learnova.com",
            password_hash=hash_password(PW_STAFF),
            full_name="Aditya Nair",
            role=UserRole.INSTRUCTOR,
            total_points=0,
        )
        learner_main = User(
            email="learner@learnova.com",
            password_hash=hash_password(PW_LEARNER),
            full_name="Rohan Mehta",
            role=UserRole.LEARNER,
            total_points=52,
        )
        learner_ananya = User(
            email="ananya.krishnan@learnova.com",
            password_hash=hash_password(PW_LEARNER),
            full_name="Ananya Krishnan",
            role=UserRole.LEARNER,
            total_points=28,
        )
        learner_vikram = User(
            email="vikram.singh@learnova.com",
            password_hash=hash_password(PW_LEARNER),
            full_name="Vikram Singh",
            role=UserRole.LEARNER,
            total_points=92,
        )
        session.add_all(
            [admin, inst_meera, inst_aditya, learner_main, learner_ananya, learner_vikram],
        )
        await session.commit()
        await session.refresh(inst_meera)
        await session.refresh(inst_aditya)
        await session.refresh(learner_main)
        await session.refresh(learner_ananya)
        await session.refresh(learner_vikram)

        specs = [
            _spec(
                "Modern Web Apps with React & TypeScript",
                "modern-web-react-typescript",
                ["Web", "React"],
                "Production-grade UI architecture, hooks, routing, and testing patterns used by product teams.",
                "https://learnova.app/c/modern-web-react-typescript",
                "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80",
                1847,
                True,
            ),
            _spec(
                "Data Storytelling for Stakeholders",
                "data-storytelling-stakeholders",
                ["Analytics", "Communication"],
                "Turn cohort charts and funnel metrics into clear narratives for leadership reviews.",
                "https://learnova.app/c/data-storytelling-stakeholders",
                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
                326,
                True,
            ),
            _spec(
                "Instructional Design Workshop",
                "instructional-design-workshop",
                ["Pedagogy", "Design"],
                "Align objectives, storyboards, and assessments using backward design.",
                "https://learnova.app/c/instructional-design-workshop",
                "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80",
                903,
                True,
            ),
            _spec(
                "Learning Analytics in Practice",
                "learning-analytics-practice",
                ["Reporting", "L&D"],
                "Completion curves, time-on-task, and survey signals—without spreadsheet overload.",
                "https://learnova.app/c/learning-analytics-practice",
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
                412,
                False,
            ),
            _spec(
                "Python for Automation at Work",
                "python-automation-work",
                ["Python", "Automation"],
                "Scripts for reports, APIs, and scheduled jobs—aimed at non-engineers.",
                "https://learnova.app/c/python-automation-work",
                "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&q=80",
                2591,
                True,
            ),
            _spec(
                "Leading Distributed Learning Teams",
                "leading-distributed-learning-teams",
                ["Leadership", "Remote"],
                "Rituals, async communication, and quality bars for geographically spread authors.",
                "https://learnova.app/c/leading-distributed-learning-teams",
                "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80",
                118,
                True,
            ),
        ]

        created_by = [inst_meera.id] * 3 + [inst_aditya.id] * 3
        courses: list[Course] = []
        for i, sp in enumerate(specs):
            c = Course(
                title=sp["title"],
                slug=sp["slug"],
                tags=sp["tags"],
                description=sp["description"],
                website=sp["website"],
                cover_image_url=sp["cover_image_url"],
                is_published=sp["is_published"],
                visibility=CourseVisibility.EVERYONE,
                access_rule=CourseAccessRule.OPEN,
                price_cents=0,
                views_count=sp["views_count"],
                created_by=created_by[i],
                responsible_user_id=created_by[i],
            )
            session.add(c)
            courses.append(c)
        await session.commit()
        for c in courses:
            await session.refresh(c)

        quizzes: list[Quiz] = []
        for c in courses:
            q = Quiz(course_id=c.id, title=f"Checkpoint — {c.title[:42]}")
            session.add(q)
            quizzes.append(q)
        await session.commit()
        for q in quizzes:
            await session.refresh(q)

        lessons_by_course: list[list[Lesson]] = []
        for ci, c in enumerate(courses):
            row: list[Lesson] = []
            for li in range(3):
                vid = Lesson(
                    course_id=c.id,
                    title=f"Module {li + 1} — concepts & practice",
                    type=LessonType.VIDEO,
                    video_url="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
                    duration_seconds=480 + li * 120 + ci * 30,
                    sort_order=li,
                    description="Guided walkthrough with downloadable notes.",
                    responsible_user_id=c.created_by,
                )
                session.add(vid)
                row.append(vid)
            ql = Lesson(
                course_id=c.id,
                title="Module assessment",
                type=LessonType.QUIZ,
                quiz_id=quizzes[ci].id,
                sort_order=3,
                responsible_user_id=c.created_by,
            )
            session.add(ql)
            row.append(ql)
            lessons_by_course.append(row)
        await session.commit()
        for row in lessons_by_course:
            for le in row:
                await session.refresh(le)

        for qz in quizzes:
            q1 = Question(
                quiz_id=qz.id,
                text="Which is the best first step when defining a measurable outcome?",
                sort_order=0,
            )
            session.add(q1)
            await session.flush()
            session.add(
                QuestionOption(
                    question_id=q1.id,
                    text="Write a learner-facing verb + object you can observe or assess.",
                    is_correct=True,
                    sort_order=0,
                ),
            )
            session.add(
                QuestionOption(
                    question_id=q1.id,
                    text="Pick a trendy buzzword for the title slide.",
                    is_correct=False,
                    sort_order=1,
                ),
            )
        await session.commit()

        def add_enrollment(uid: UUID, course: Course, staff: UUID, status: EnrollmentStatus) -> None:
            session.add(
                Enrollment(
                    user_id=uid,
                    course_id=course.id,
                    enrolled_by=staff,
                    status=status,
                ),
            )

        # Rohan: 4 published courses (indices 0,1,2,4 — skip draft 3)
        rohan_idx = [0, 1, 2, 4]
        for i in rohan_idx:
            add_enrollment(learner_main.id, courses[i], created_by[i], EnrollmentStatus.IN_PROGRESS)

        add_enrollment(learner_ananya.id, courses[0], inst_meera.id, EnrollmentStatus.IN_PROGRESS)
        add_enrollment(learner_ananya.id, courses[5], inst_aditya.id, EnrollmentStatus.ENROLLED)

        add_enrollment(learner_vikram.id, courses[1], inst_meera.id, EnrollmentStatus.COMPLETED)
        add_enrollment(learner_vikram.id, courses[4], inst_aditya.id, EnrollmentStatus.IN_PROGRESS)
        add_enrollment(learner_vikram.id, courses[2], inst_meera.id, EnrollmentStatus.IN_PROGRESS)
        await session.commit()

        er = await session.execute(
            select(Enrollment)
            .where(Enrollment.user_id == learner_main.id)
            .order_by(Enrollment.enrolled_at),
        )
        ens_rohan = list(er.scalars().all())

        now = datetime.now(timezone.utc)
        cid_to_ci = {c.id: i for i, c in enumerate(courses)}
        # Average completion ≈69%: complete 3,3,2,3 of 4 lessons per course → 75%,75%,50%,75% → 68.75%
        complete_lesson_counts = [3, 3, 2, 3]
        for ei, en in enumerate(ens_rohan):
            ci = cid_to_ci[en.course_id]
            row = lessons_by_course[ci]
            n_done = complete_lesson_counts[ei]
            for li in range(n_done):
                session.add(
                    LessonProgress(
                        enrollment_id=en.id,
                        lesson_id=row[li].id,
                        time_spent_seconds=300 + li * 40,
                        completed_at=now,
                    ),
                )
        await session.commit()

        reviews_data: list[tuple[UUID, UUID, int, str]] = [
            (
                learner_main.id,
                courses[0].id,
                5,
                "Crisp modules and practical examples—exactly what our cohort needed before the release.",
            ),
            (
                learner_ananya.id,
                courses[0].id,
                4,
                "Well paced. Would love a short glossary PDF for the analytics terms.",
            ),
            (
                learner_main.id,
                courses[1].id,
                5,
                "Finally a course that connects charts to decisions, not vanity metrics.",
            ),
            (
                learner_vikram.id,
                courses[1].id,
                5,
                "Used two techniques from Module 2 in our QBR—received great feedback.",
            ),
            (
                learner_main.id,
                courses[2].id,
                4,
                "Solid instructional-design backbone; templates are reusable.",
            ),
        ]
        for uid, cid, rating, comment in reviews_data:
            session.add(
                Review(
                    user_id=uid,
                    course_id=cid,
                    rating=rating,
                    comment=comment,
                ),
            )

        for ci in range(len(courses)):
            session.add(
                LessonAttachment(
                    lesson_id=lessons_by_course[ci][0].id,
                    type=AttachmentType.LINK,
                    url="https://developer.mozilla.org/en-US/docs/Learn",
                    label="Further reading",
                ),
            )
        await session.commit()

    print(
        "Demo database ready.\n"
        "  Admin:       admin@learnova.com / Admin123!\n"
        "  Instructors: instructor@learnova.com, aditya.nair@learnova.com / Instructor123!\n"
        "  Learners:    learner@learnova.com (Rohan, 52 pts), "
        "ananya.krishnan@, vikram.singh@ / Learner123!\n",
    )


def main() -> None:
    asyncio.run(reset_and_seed())


if __name__ == "__main__":
    main()
