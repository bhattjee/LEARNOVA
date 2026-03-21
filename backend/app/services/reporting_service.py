"""
reporting_service.py — Aggregates enrollment and lesson progress data
for the instructor/admin reporting dashboard.
"""

import uuid
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course_model import Course
from app.models.enrollment_model import Enrollment, EnrollmentStatus
from app.models.lesson_model import Lesson
from app.models.lesson_progress_model import LessonProgress
from app.models.user_model import User, UserRole
from app.schemas.reporting_schema import (
    ReportingOverview,
    ReportingResponse,
    ReportingRow,
    ReportingRowStatus,
)

StatusFilter = Literal["all", "not_started", "in_progress", "completed"]


def _enrollment_status_to_row_status(es: EnrollmentStatus) -> ReportingRowStatus:
    if es == EnrollmentStatus.ENROLLED:
        return "yet_to_start"
    if es == EnrollmentStatus.IN_PROGRESS:
        return "in_progress"
    return "completed"


def _status_filter_to_enum(sf: StatusFilter) -> EnrollmentStatus | None:
    if sf == "not_started":
        return EnrollmentStatus.ENROLLED
    if sf == "in_progress":
        return EnrollmentStatus.IN_PROGRESS
    if sf == "completed":
        return EnrollmentStatus.COMPLETED
    return None


def _base_scope_conditions(
    user: User,
    course_id: uuid.UUID | None,
) -> list:
    conds = [
        Course.deleted_at.is_(None),
        User.deleted_at.is_(None),
    ]
    if user.role == UserRole.INSTRUCTOR:
        conds.append(Course.created_by == user.id)
    if course_id is not None:
        conds.append(Enrollment.course_id == course_id)
    return conds


async def _count_by_status(
    db: AsyncSession,
    user: User,
    course_id: uuid.UUID | None,
    target_status: EnrollmentStatus,
) -> int:
    conds = _base_scope_conditions(user, course_id)
    conds.append(Enrollment.status == target_status)
    q = (
        select(func.count(Enrollment.id))
        .select_from(Enrollment)
        .join(User, User.id == Enrollment.user_id)
        .join(Course, Course.id == Enrollment.course_id)
        .where(*conds)
    )
    return int(await db.scalar(q) or 0)


async def get_reporting_data(
    db: AsyncSession,
    user: User,
    status_filter: StatusFilter,
    course_id: uuid.UUID | None,
    page: int,
    limit: int,
) -> ReportingResponse:
    if user.role not in (UserRole.ADMIN, UserRole.INSTRUCTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed",
        )

    if course_id is not None:
        course = await db.scalar(
            select(Course).where(Course.id == course_id, Course.deleted_at.is_(None)),
        )
        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )
        if user.role == UserRole.INSTRUCTOR and course.created_by != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )

    overview_total = await _count_enrollments_total(db, user, course_id)
    overview_yet = await _count_by_status(db, user, course_id, EnrollmentStatus.ENROLLED)
    overview_ip = await _count_by_status(db, user, course_id, EnrollmentStatus.IN_PROGRESS)
    overview_done = await _count_by_status(db, user, course_id, EnrollmentStatus.COMPLETED)

    overview = ReportingOverview(
        total_participants=overview_total,
        yet_to_start=overview_yet,
        in_progress=overview_ip,
        completed=overview_done,
    )

    list_conds = _base_scope_conditions(user, course_id)
    sf_enum = _status_filter_to_enum(status_filter)
    if sf_enum is not None:
        list_conds.append(Enrollment.status == sf_enum)

    lc_sq = (
        select(Lesson.course_id.label("cid"), func.count(Lesson.id).label("lesson_total"))
        .where(Lesson.deleted_at.is_(None))
        .group_by(Lesson.course_id)
        .subquery()
    )

    pc_sq = (
        select(
            LessonProgress.enrollment_id.label("eid"),
            func.coalesce(
                func.sum(case((LessonProgress.completed_at.is_not(None), 1), else_=0)),
                0,
            ).label("done_cnt"),
            func.coalesce(func.sum(LessonProgress.time_spent_seconds), 0).label("time_sum"),
        )
        .group_by(LessonProgress.enrollment_id)
        .subquery()
    )

    count_q = (
        select(func.count(Enrollment.id))
        .select_from(Enrollment)
        .join(User, User.id == Enrollment.user_id)
        .join(Course, Course.id == Enrollment.course_id)
        .where(*list_conds)
    )
    total_filtered = int(await db.scalar(count_q) or 0)

    offset = max(page - 1, 0) * limit
    rows_q = (
        select(
            Enrollment,
            User,
            Course,
            func.coalesce(lc_sq.c.lesson_total, 0).label("total_lessons"),
            func.coalesce(pc_sq.c.done_cnt, 0).label("completed_lessons"),
            func.coalesce(pc_sq.c.time_sum, 0).label("time_spent"),
        )
        .join(User, User.id == Enrollment.user_id)
        .join(Course, Course.id == Enrollment.course_id)
        .outerjoin(lc_sq, lc_sq.c.cid == Course.id)
        .outerjoin(pc_sq, pc_sq.c.eid == Enrollment.id)
        .where(*list_conds)
        .order_by(Enrollment.enrolled_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(rows_q)
    raw_rows = result.all()

    out_rows: list[ReportingRow] = []
    for i, row in enumerate(raw_rows):
        en: Enrollment = row[0]
        u: User = row[1]
        c: Course = row[2]
        total_lessons = int(row.total_lessons)
        completed_lessons = int(row.completed_lessons)
        time_spent = int(row.time_spent)
        if total_lessons > 0:
            pct = round((completed_lessons / total_lessons) * 1000) / 10.0
        else:
            pct = 0.0
        out_rows.append(
            ReportingRow(
                sr_no=offset + i + 1,
                course_name=c.title,
                participant_name=u.full_name,
                participant_email=u.email,
                enrolled_date=en.enrolled_at,
                start_date=en.start_date,
                time_spent_seconds=time_spent,
                completion_percentage=pct,
                completed_date=en.completed_at,
                status=_enrollment_status_to_row_status(en.status),
            )
        )

    return ReportingResponse(
        overview=overview,
        rows=out_rows,
        total=total_filtered,
        page=page,
        limit=limit,
    )


async def _count_enrollments_total(
    db: AsyncSession,
    user: User,
    course_id: uuid.UUID | None,
) -> int:
    conds = _base_scope_conditions(user, course_id)
    q = (
        select(func.count(Enrollment.id))
        .select_from(Enrollment)
        .join(User, User.id == Enrollment.user_id)
        .join(Course, Course.id == Enrollment.course_id)
        .where(*conds)
    )
    return int(await db.scalar(q) or 0)
