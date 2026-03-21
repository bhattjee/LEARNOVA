"""
progress_service.py — Starting and completing lessons, enrollment updates, course progress.
"""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course_model import Course, CourseAccessRule
from app.models.enrollment_model import Enrollment, EnrollmentStatus
from app.models.lesson_model import Lesson
from app.models.lesson_progress_model import LessonProgress
from app.models.user_model import User, UserRole
from app.schemas.lesson_schema import LessonItem
from app.schemas.progress_schema import CompleteLessonResult, LessonProgressResponse
from app.services.lesson_service import lesson_to_item


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _row_to_api_status(lp: LessonProgress | None) -> str:
    if lp is None:
        return "not_started"
    if lp.completed_at is not None:
        return "completed"
    return "in_progress"


async def _load_published_course(db: AsyncSession, course_id: uuid.UUID) -> Course:
    result = await db.execute(
        select(Course).where(
            Course.id == course_id,
            Course.deleted_at.is_(None),
            Course.is_published.is_(True),
        ),
    )
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    return course


async def _ensure_enrollment(db: AsyncSession, user: User, course: Course) -> Enrollment:
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course.id,
        ),
    )
    en = result.scalar_one_or_none()
    if en is not None:
        return en
    if course.access_rule != CourseAccessRule.OPEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be enrolled in this course",
        )
    en = Enrollment(
        user_id=user.id,
        course_id=course.id,
        enrolled_by=None,
        status=EnrollmentStatus.ENROLLED,
    )
    db.add(en)
    await db.flush()
    return en


async def _load_lesson_player(db: AsyncSession, lesson_id: uuid.UUID) -> Lesson | None:
    result = await db.execute(
        select(Lesson)
        .options(selectinload(Lesson.attachments))
        .where(Lesson.id == lesson_id, Lesson.deleted_at.is_(None)),
    )
    return result.scalar_one_or_none()


async def _lesson_total_for_course(db: AsyncSession, course_id: uuid.UUID) -> int:
    n = await db.scalar(
        select(func.count(Lesson.id)).where(
            Lesson.course_id == course_id,
            Lesson.deleted_at.is_(None),
        ),
    )
    return int(n or 0)


async def _completed_lesson_count(db: AsyncSession, enrollment_id: uuid.UUID, course_id: uuid.UUID) -> int:
    n = await db.scalar(
        select(func.count(Lesson.id))
        .select_from(Lesson)
        .join(
            LessonProgress,
            and_(
                LessonProgress.lesson_id == Lesson.id,
                LessonProgress.enrollment_id == enrollment_id,
                LessonProgress.completed_at.is_not(None),
            ),
        )
        .where(
            Lesson.course_id == course_id,
            Lesson.deleted_at.is_(None),
        ),
    )
    return int(n or 0)


async def get_player_lesson(
    db: AsyncSession,
    user: User,
    course_id: uuid.UUID,
    lesson_id: uuid.UUID,
) -> LessonItem:
    if user.role != UserRole.LEARNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Learner access only",
        )
    course = await _load_published_course(db, course_id)
    lesson = await _load_lesson_player(db, lesson_id)
    if lesson is None or lesson.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )
    await _ensure_enrollment(db, user, course)
    item: LessonItem = await lesson_to_item(db, lesson)
    return item


async def start_lesson(
    db: AsyncSession,
    user: User,
    lesson_id: uuid.UUID,
    course_id: uuid.UUID,
) -> LessonProgressResponse:
    if user.role != UserRole.LEARNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Learner access only",
        )
    course = await _load_published_course(db, course_id)
    lesson = await _load_lesson_player(db, lesson_id)
    if lesson is None or lesson.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    en = await _ensure_enrollment(db, user, course)
    now = _utcnow()

    result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.enrollment_id == en.id,
            LessonProgress.lesson_id == lesson_id,
        ),
    )
    lp = result.scalar_one_or_none()
    if lp is None:
        lp = LessonProgress(
            enrollment_id=en.id,
            lesson_id=lesson_id,
            time_spent_seconds=0,
        )
        db.add(lp)
        await db.flush()

    if lp.completed_at is not None:
        await db.commit()
        await db.refresh(lp)
        return LessonProgressResponse(
            lesson_id=lesson_id,
            status="completed",
            time_spent_seconds=lp.time_spent_seconds,
            completed_at=lp.completed_at,
        )

    if en.start_date is None:
        en.start_date = now
    if en.status != EnrollmentStatus.COMPLETED:
        en.status = EnrollmentStatus.IN_PROGRESS

    await db.commit()
    await db.refresh(lp)
    return LessonProgressResponse(
        lesson_id=lesson_id,
        status=_row_to_api_status(lp),
        time_spent_seconds=lp.time_spent_seconds,
        completed_at=lp.completed_at,
    )


async def complete_lesson(
    db: AsyncSession,
    user: User,
    lesson_id: uuid.UUID,
    course_id: uuid.UUID,
    time_spent_seconds: int,
) -> CompleteLessonResult:
    if user.role != UserRole.LEARNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Learner access only",
        )
    course = await _load_published_course(db, course_id)
    lesson = await _load_lesson_player(db, lesson_id)
    if lesson is None or lesson.course_id != course_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found",
        )

    en = await _ensure_enrollment(db, user, course)
    now = _utcnow()

    result = await db.execute(
        select(LessonProgress).where(
            LessonProgress.enrollment_id == en.id,
            LessonProgress.lesson_id == lesson_id,
        ),
    )
    lp = result.scalar_one_or_none()
    if lp is None:
        lp = LessonProgress(
            enrollment_id=en.id,
            lesson_id=lesson_id,
            time_spent_seconds=0,
        )
        db.add(lp)
        await db.flush()

    lp.time_spent_seconds = int(lp.time_spent_seconds or 0) + max(0, time_spent_seconds)
    if lp.completed_at is None:
        lp.completed_at = now

    total_lessons = await _lesson_total_for_course(db, course_id)
    done = await _completed_lesson_count(db, en.id, course_id)
    pct = round((done / total_lessons) * 1000) / 10.0 if total_lessons > 0 else 0.0
    all_completed = total_lessons > 0 and done >= total_lessons

    if all_completed:
        en.status = EnrollmentStatus.COMPLETED
        en.completed_at = now
    elif en.status == EnrollmentStatus.ENROLLED:
        en.status = EnrollmentStatus.IN_PROGRESS

    await db.commit()
    await db.refresh(lp)

    return CompleteLessonResult(
        lesson_status="completed",
        course_completion_percentage=pct,
        all_completed=all_completed,
        lesson_id=lesson_id,
        time_spent_seconds=lp.time_spent_seconds,
        completed_at=lp.completed_at,
    )
