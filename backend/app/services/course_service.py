"""
course_service.py — Business logic for creating, listing, and managing courses.
Instructors see only their courses; admins see all.
"""

import re
import secrets
import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.core.config import settings
from app.models.attachment_model import LessonAttachment
from app.models.course_model import Course, CourseAccessRule, CourseVisibility
from app.models.enrollment_model import Enrollment, EnrollmentStatus
from app.models.lesson_model import Lesson
from app.models.lesson_progress_model import LessonProgress
from app.models.user_model import User, UserRole
from app.schemas.auth_schema import UserPublic
from app.schemas.course_schema import (
    AddAttendeesResponse,
    CompleteCourseResult,
    ContactAttendeesResponse,
    CourseDetail,
    CourseDetailForLearner,
    CourseListItem,
    CreateCourseRequest,
    LearnerCourseItem,
    LearnerCourseStatus,
    LessonProgressItem,
    PublicCourseItem,
    UpdateCourseOptions,
    UpdateCourseRequest,
)


def slugify_title(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:500] if s else "course"


from app.services import email_service


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_email_list(raw: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in raw:
        e = item.strip().lower()
        if not e or e in seen:
            continue
        if not _EMAIL_RE.match(e):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid email address: {item.strip()!r}",
            )
        seen.add(e)
        out.append(e)
    return out


async def _user_by_email(db: AsyncSession, email_lower: str) -> User | None:
    result = await db.execute(
        select(User).where(
            func.lower(User.email) == email_lower,
            User.deleted_at.is_(None),
        ),
    )
    return result.scalar_one_or_none()


async def _create_invited_learner(db: AsyncSession, email_lower: str) -> User:
    local = email_lower.split("@", 1)[0]
    display = local.replace(".", " ").replace("_", " ").strip().title() or "Learner"
    user = User(
        email=email_lower,
        password_hash=hash_password(secrets.token_urlsafe(32)),
        full_name=display[:255],
        role=UserRole.LEARNER,
    )
    db.add(user)
    await db.flush()
    return user


async def update_course_options(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
    data: UpdateCourseOptions,
) -> CourseDetail:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    payload = data.model_dump(exclude_unset=True)
    if "visibility" in payload and payload["visibility"] is not None:
        course.visibility = payload["visibility"]
    if "access_rule" in payload and payload["access_rule"] is not None:
        course.access_rule = payload["access_rule"]
    if "price_cents" in payload:
        course.price_cents = payload["price_cents"]
    if "responsible_user_id" in payload:
        course.responsible_user_id = payload["responsible_user_id"]
    if course.access_rule == CourseAccessRule.ON_PAYMENT:
        pc = course.price_cents
        if pc is None or int(pc) <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Price is required and must be greater than zero when access rule is On Payment.",
            )
    await db.commit()
    await db.refresh(course)
    return await course_to_detail(db, course)


async def get_course_attendees(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
) -> list[UserPublic]:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    result = await db.execute(
        select(User)
        .join(Enrollment, Enrollment.user_id == User.id)
        .where(Enrollment.course_id == course_id, User.deleted_at.is_(None))
        .order_by(Enrollment.enrolled_at),
    )
    users = result.scalars().unique().all()
    return [UserPublic.model_validate(u) for u in users]


async def add_attendees(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
    emails: list[str],
    background_tasks: BackgroundTasks,
) -> AddAttendeesResponse:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    normalized = _normalize_email_list(emails)
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid email addresses provided",
        )

    staff_emails: list[str] = []
    resolved: list[tuple[str, User | None]] = []
    for e in normalized:
        u = await _user_by_email(db, e)
        if u is not None and u.role != UserRole.LEARNER:
            staff_emails.append(e)
        else:
            resolved.append((e, u))

    if staff_emails:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff and instructor accounts cannot be added as attendees: "
            + ", ".join(staff_emails),
        )

    added: int = 0
    already_enrolled: int = 0
    for e, u in resolved:
        learner = u
        if learner is None:
            learner = await _create_invited_learner(db, e)
        existing = await db.scalar(
            select(Enrollment.id).where(
                Enrollment.course_id == course_id,
                Enrollment.user_id == learner.id,
            ),
        )
        if existing is not None:
            already_enrolled += 1
            continue
        db.add(
            Enrollment(
                user_id=learner.id,
                course_id=course_id,
                enrolled_by=user.id,
                status=EnrollmentStatus.ENROLLED,
            ),
        )
        added += 1

        background_tasks.add_task(
            email_service.send_course_invitation,
            to_email=learner.email,
            to_name=learner.full_name,
            course_title=course.title,
            instructor_name=user.full_name,
            login_url=f"{settings.allowed_origins_list[0]}/login" if settings.allowed_origins_list else f"{settings.upload_dir}/login"
        )

    await db.commit()
    return AddAttendeesResponse(
        added=added,
        already_enrolled=already_enrolled,
        emails_queued=added,
    )


async def contact_attendees(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
    subject: str,
    body: str,
    background_tasks: BackgroundTasks,
) -> ContactAttendeesResponse:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    result = await db.execute(
        select(User)
        .join(Enrollment, Enrollment.user_id == User.id)
        .where(Enrollment.course_id == course_id, User.deleted_at.is_(None))
    )
    learners = result.scalars().all()

    for learner in learners:
        background_tasks.add_task(
            email_service.send_instructor_message,
            to_email=learner.email,
            to_name=learner.full_name,
            course_title=course.title,
            subject=subject,
            body=body,
        )

    return ContactAttendeesResponse(queued=len(learners))


async def _next_unique_slug(
    db: AsyncSession,
    base_slug: str,
    *,
    exclude_course_id: uuid.UUID | None = None,
) -> str:
    suffix = 0
    while True:
        candidate = base_slug if suffix == 0 else f"{base_slug}-{suffix}"
        q = select(Course.id).where(
            Course.slug == candidate,
            Course.deleted_at.is_(None),
        )
        if exclude_course_id is not None:
            q = q.where(Course.id != exclude_course_id)
        existing = await db.scalar(q)
        if existing is None:
            return candidate[:500]
        suffix += 1


def _lesson_stats_subquery():
    return (
        select(
            Lesson.course_id.label("course_id"),
            func.count(Lesson.id).label("lc"),
            func.coalesce(func.sum(Lesson.duration_seconds), 0).label("ds"),
        )
        .where(Lesson.deleted_at.is_(None))
        .group_by(Lesson.course_id)
        .subquery()
    )


async def get_courses(
    db: AsyncSession,
    user: User,
    search: str | None,
    page: int,
    limit: int,
) -> tuple[list[CourseListItem], int]:
    lesson_stats = _lesson_stats_subquery()

    filters = [Course.deleted_at.is_(None)]
    if user.role == UserRole.INSTRUCTOR:
        filters.append(Course.created_by == user.id)
    if search and search.strip():
        filters.append(Course.title.ilike(f"%{search.strip()}%"))

    total = int(
        await db.scalar(select(func.count(Course.id)).where(*filters)) or 0,
    )

    offset = max(page - 1, 0) * limit
    stmt = (
        select(
            Course,
            func.coalesce(lesson_stats.c.lc, 0).label("total_lessons_count"),
            func.coalesce(lesson_stats.c.ds, 0).label("total_duration_seconds"),
        )
        .outerjoin(lesson_stats, lesson_stats.c.course_id == Course.id)
        .where(*filters)
        .order_by(Course.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()

    items: list[CourseListItem] = []
    for row in rows:
        c: Course = row[0]
        items.append(
            CourseListItem(
                id=c.id,
                title=c.title,
                tags=list(c.tags or []),
                cover_image_url=c.cover_image_url,
                is_published=c.is_published,
                views_count=c.views_count,
                total_lessons_count=int(row.total_lessons_count),
                total_duration_seconds=int(row.total_duration_seconds),
                created_at=c.created_at,
            ),
        )
    return items, total


async def create_course(
    db: AsyncSession,
    user: User,
    data: CreateCourseRequest,
) -> CourseListItem:
    base = slugify_title(data.title)
    slug = await _next_unique_slug(db, base, exclude_course_id=None)
    course = Course(
        title=data.title.strip(),
        slug=slug,
        tags=[],
        created_by=user.id,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return CourseListItem(
        id=course.id,
        title=course.title,
        tags=list(course.tags or []),
        cover_image_url=course.cover_image_url,
        is_published=course.is_published,
        views_count=course.views_count,
        total_lessons_count=0,
        total_duration_seconds=0,
        created_at=course.created_at,
    )


async def _lesson_counts_for_course(db: AsyncSession, course_id: uuid.UUID) -> tuple[int, int]:
    row = await db.execute(
        select(
            func.count(Lesson.id),
            func.coalesce(func.sum(Lesson.duration_seconds), 0),
        ).where(
            Lesson.course_id == course_id,
            Lesson.deleted_at.is_(None),
        ),
    )
    cnt, dur = row.one()
    return int(cnt), int(dur)


async def _load_course_for_staff(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
) -> Course | None:
    q = select(Course).where(
        Course.id == course_id,
        Course.deleted_at.is_(None),
    )
    if user.role == UserRole.INSTRUCTOR:
        q = q.where(Course.created_by == user.id)
    result = await db.execute(q)
    return result.scalar_one_or_none()


async def _load_responsible_user(db: AsyncSession, course: Course) -> User | None:
    if course.responsible_user_id is None:
        return None
    result = await db.execute(
        select(User).where(
            User.id == course.responsible_user_id,
            User.deleted_at.is_(None),
        ),
    )
    return result.scalar_one_or_none()


async def course_to_detail(db: AsyncSession, course: Course) -> CourseDetail:
    responsible = await _load_responsible_user(db, course)
    lc, ds = await _lesson_counts_for_course(db, course.id)
    ru_pub = UserPublic.model_validate(responsible) if responsible else None
    return CourseDetail(
        id=course.id,
        title=course.title,
        slug=course.slug,
        tags=list(course.tags or []),
        cover_image_url=course.cover_image_url,
        is_published=course.is_published,
        website=course.website,
        visibility=course.visibility,
        access_rule=course.access_rule,
        price_cents=course.price_cents,
        responsible_user_id=course.responsible_user_id,
        created_by=course.created_by,
        views_count=course.views_count,
        description=course.description,
        created_at=course.created_at,
        updated_at=course.updated_at,
        responsible_user=ru_pub,
        total_lessons_count=lc,
        total_duration_seconds=ds,
    )


async def get_course_by_id(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
) -> CourseDetail:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    return await course_to_detail(db, course)


async def update_course(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
    data: UpdateCourseRequest,
) -> CourseDetail:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    payload = data.model_dump(exclude_unset=True)
    if "title" in payload and payload["title"] is not None:
        new_title = payload["title"].strip()
        if new_title != course.title:
            course.title = new_title
            base = slugify_title(new_title)
            course.slug = await _next_unique_slug(
                db,
                base,
                exclude_course_id=course.id,
            )
    if "tags" in payload:
        course.tags = list(payload["tags"] or [])
    if "website" in payload:
        w = payload["website"]
        if w is None:
            course.website = None
        else:
            course.website = w.strip() if str(w).strip() else None
    if "responsible_user_id" in payload:
        course.responsible_user_id = payload["responsible_user_id"]
    if "visibility" in payload and payload["visibility"] is not None:
        course.visibility = payload["visibility"]
    if "access_rule" in payload and payload["access_rule"] is not None:
        course.access_rule = payload["access_rule"]
    if "price_cents" in payload:
        course.price_cents = payload["price_cents"]
    if "description" in payload:
        course.description = payload["description"]
    if "cover_image_url" in payload:
        v = payload["cover_image_url"]
        course.cover_image_url = None if v is None else (str(v).strip() or None)
    await db.commit()
    await db.refresh(course)
    return await course_to_detail(db, course)


async def toggle_publish(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
) -> CourseDetail:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    new_published = not course.is_published
    if new_published:
        if not course.website or not str(course.website).strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Website URL is required before publishing",
            )
    course.is_published = new_published
    await db.commit()
    await db.refresh(course)
    return await course_to_detail(db, course)


async def soft_delete_course(
    db: AsyncSession,
    course_id: uuid.UUID,
) -> None:
    result = await db.execute(
        select(Course).where(
            Course.id == course_id,
            Course.deleted_at.is_(None),
        ),
    )
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    course.deleted_at = datetime.now(timezone.utc)
    await db.commit()


def _short_course_description(desc: str | None, max_len: int = 200) -> str | None:
    if desc is None:
        return None
    s = desc.strip()
    if not s:
        return None
    if len(s) <= max_len:
        return s
    return s[: max_len - 1].rstrip() + "…"


def _enrollment_status_to_learner_course_status(status: EnrollmentStatus) -> LearnerCourseStatus:
    if status == EnrollmentStatus.ENROLLED:
        return "enrolled"
    if status == EnrollmentStatus.IN_PROGRESS:
        return "in_progress"
    return "completed"


def _lesson_row_status_from_progress(row: LessonProgress | None) -> Literal["not_started", "in_progress", "completed"]:
    if row is None:
        return "not_started"
    if row.completed_at is not None:
        return "completed"
    if (row.time_spent_seconds or 0) > 0:
        return "in_progress"
    return "not_started"


async def get_course_detail_for_learner(
    db: AsyncSession,
    course_id: uuid.UUID,
    current_user: User | None,
) -> CourseDetailForLearner:
    result = await db.execute(
        select(Course).where(
            Course.id == course_id,
            Course.deleted_at.is_(None),
        ),
    )
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    can_preview_draft = False
    if current_user is not None:
        if current_user.role == UserRole.ADMIN:
            can_preview_draft = True
        elif current_user.role == UserRole.INSTRUCTOR and course.created_by == current_user.id:
            can_preview_draft = True

    if not course.is_published and not can_preview_draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    if course.visibility == CourseVisibility.SIGNED_IN and current_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    enrollment: Enrollment | None = None
    if current_user is not None:
        er = await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id == course_id,
            ),
        )
        enrollment = er.scalar_one_or_none()

    lr = await db.execute(
        select(Lesson)
        .where(
            Lesson.course_id == course_id,
            Lesson.deleted_at.is_(None),
        )
        .order_by(Lesson.sort_order.asc(), Lesson.created_at.asc()),
    )
    lessons: list[Lesson] = list(lr.scalars())

    lesson_ids = [les.id for les in lessons]
    progress_by_lesson: dict[uuid.UUID, LessonProgress] = {}
    if enrollment is not None and lesson_ids:
        pr = await db.execute(
            select(LessonProgress).where(LessonProgress.enrollment_id == enrollment.id),
        )
        for lp in pr.scalars():
            progress_by_lesson[lp.lesson_id] = lp

    has_att: set[uuid.UUID] = set()
    if lesson_ids:
        ar = await db.execute(
            select(LessonAttachment.lesson_id)
            .where(LessonAttachment.lesson_id.in_(lesson_ids))
            .distinct(),
        )
        has_att = {row[0] for row in ar.all()}

    items: list[LessonProgressItem] = []
    completed: int = 0
    for les in lessons:
        st = _lesson_row_status_from_progress(progress_by_lesson.get(les.id))
        if st == "completed":
            completed += 1
        items.append(
            LessonProgressItem(
                lesson_id=les.id,
                title=les.title,
                type=les.type.value,
                status=st,
                sort_order=les.sort_order,
                has_attachments=les.id in has_att,
                duration_seconds=les.duration_seconds,
            ),
        )

    total = len(lessons)
    incomplete = total - completed
    pct = round((completed / total) * 1000) / 10.0 if total > 0 else 0.0

    en_stat: LearnerCourseStatus | None
    if current_user is None:
        en_stat = None
    elif enrollment is None:
        en_stat = "not_enrolled"
    else:
        en_stat = _enrollment_status_to_learner_course_status(enrollment.status)

    total_dur = sum(int(les.duration_seconds) for les in lessons)

    return CourseDetailForLearner(
        id=course.id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        cover_image_url=course.cover_image_url,
        tags=list(course.tags or []),
        visibility=course.visibility,
        access_rule=course.access_rule,
        price_cents=course.price_cents,
        average_rating=None,
        total_duration_seconds=total_dur,
        total_lessons=total,
        completed_count=completed,
        incomplete_count=incomplete,
        completion_percentage=pct,
        lessons=items,
        enrollment_status=en_stat,
    )


def _progress_by_enrollment_subq():
    return (
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


async def get_public_courses(
    db: AsyncSession,
    current_user: User | None,
    search: str | None,
) -> list[PublicCourseItem]:
    lesson_stats = _lesson_stats_subquery()
    filters = [
        Course.deleted_at.is_(None),
        Course.is_published.is_(True),
    ]
    if current_user is None:
        filters.append(Course.visibility == CourseVisibility.EVERYONE)
    else:
        filters.append(
            or_(
                Course.visibility == CourseVisibility.EVERYONE,
                Course.visibility == CourseVisibility.SIGNED_IN,
            ),
        )
    if search and search.strip():
        filters.append(Course.title.ilike(f"%{search.strip()}%"))

    stmt = (
        select(
            Course,
            func.coalesce(lesson_stats.c.lc, 0).label("total_lessons_count"),
            func.coalesce(lesson_stats.c.ds, 0).label("total_duration_seconds"),
        )
        .outerjoin(lesson_stats, lesson_stats.c.course_id == Course.id)
        .where(*filters)
        .order_by(Course.title.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    tlc_by_cid = {row[0].id: int(row.total_lessons_count) for row in rows}
    course_ids = list(tlc_by_cid.keys())
    enroll_map: dict[uuid.UUID, Enrollment] = {}
    if current_user is not None and course_ids:
        er = await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id.in_(course_ids),
            ),
        )
        for en in er.scalars():
            enroll_map[en.course_id] = en

    eids = [e.id for e in enroll_map.values()]
    done_by_eid: dict[uuid.UUID, int] = {}
    if eids:
        agg = await db.execute(
            select(
                LessonProgress.enrollment_id,
                func.coalesce(
                    func.sum(case((LessonProgress.completed_at.is_not(None), 1), else_=0)),
                    0,
                ).label("done"),
            )
            .where(LessonProgress.enrollment_id.in_(eids))
            .group_by(LessonProgress.enrollment_id),
        )
        for pr in agg:
            done_by_eid[pr.enrollment_id] = int(pr.done)

    pct_by_cid: dict[uuid.UUID, float] = {}
    for cid, en in enroll_map.items():
        tlc = tlc_by_cid.get(cid, 0)
        done = done_by_eid.get(en.id, 0)
        pct_by_cid[cid] = round((done / tlc) * 1000) / 10.0 if tlc > 0 else 0.0

    items: list[PublicCourseItem] = []
    for row in rows:
        c: Course = row[0]
        tlc = int(row.total_lessons_count)
        tds = int(row.total_duration_seconds)
        learner_status: LearnerCourseStatus | None
        if current_user is None:
            learner_status = None
        elif c.id not in enroll_map:
            learner_status = "not_enrolled"
        else:
            learner_status = _enrollment_status_to_learner_course_status(enroll_map[c.id].status)

        comp_pct: float | None = None
        if learner_status == "in_progress":
            comp_pct = pct_by_cid.get(c.id, 0.0)

        items.append(
            PublicCourseItem(
                id=c.id,
                title=c.title,
                slug=c.slug,
                cover_image_url=c.cover_image_url,
                tags=list(c.tags or []),
                description_short=_short_course_description(c.description),
                total_lessons_count=tlc,
                total_duration_seconds=tds,
                visibility=c.visibility,
                access_rule=c.access_rule,
                price_cents=c.price_cents,
                average_rating=None,
                learner_status=learner_status,
                completion_percentage=comp_pct,
            ),
        )
    return items


async def get_my_courses(
    db: AsyncSession,
    user: User,
) -> list[LearnerCourseItem]:
    lesson_stats = _lesson_stats_subquery()
    pc_sq = _progress_by_enrollment_subq()

    stmt = (
        select(
            Enrollment,
            Course,
            func.coalesce(lesson_stats.c.lc, 0).label("total_lessons_count"),
            func.coalesce(lesson_stats.c.ds, 0).label("total_duration_seconds"),
            func.coalesce(pc_sq.c.done_cnt, 0).label("done_cnt"),
        )
        .join(Course, Course.id == Enrollment.course_id)
        .outerjoin(lesson_stats, lesson_stats.c.course_id == Course.id)
        .outerjoin(pc_sq, pc_sq.c.eid == Enrollment.id)
        .where(Enrollment.user_id == user.id, Course.deleted_at.is_(None))
        .order_by(Enrollment.enrolled_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    items: list[LearnerCourseItem] = []
    for row in rows:
        en: Enrollment = row[0]
        c: Course = row[1]
        tlc = int(row.total_lessons_count)
        done = int(row.done_cnt)
        if tlc > 0:
            pct = round((done / tlc) * 1000) / 10.0
        else:
            pct = 0.0
        st = _enrollment_status_to_learner_course_status(en.status)
        items.append(
            LearnerCourseItem(
                id=c.id,
                title=c.title,
                slug=c.slug,
                cover_image_url=c.cover_image_url,
                tags=list(c.tags or []),
                description_short=_short_course_description(c.description),
                total_lessons_count=tlc,
                total_duration_seconds=int(row.total_duration_seconds),
                visibility=c.visibility,
                access_rule=c.access_rule,
                price_cents=c.price_cents,
                average_rating=None,
                learner_status=st,
                completion_percentage=pct,
                enrolled_at=en.enrolled_at,
            ),
        )
    return items


async def purchase_course_enrollment(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
) -> None:
    """
    Create an enrollment for a published paid course after a successful (mock) checkout.
    Admins and instructors may also enroll in unpublished courses for preview purposes.
    Idempotent if already enrolled.
    """
    filters = [Course.id == course_id, Course.deleted_at.is_(None)]
    # Learners can only purchase published courses; staff can enroll in any course
    if user.role == UserRole.LEARNER:
        filters.append(Course.is_published.is_(True))
    result = await db.execute(
        select(Course).where(*filters),
    )
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    if course.access_rule != CourseAccessRule.ON_PAYMENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This course does not require purchase",
        )
    existing = await db.scalar(
        select(Enrollment.id).where(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course_id,
        ),
    )
    if existing is not None:
        return
    db.add(
        Enrollment(
            user_id=user.id,
            course_id=course_id,
            enrolled_by=None,
            status=EnrollmentStatus.ENROLLED,
        ),
    )
    await db.commit()


async def complete_course_for_learner(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
) -> CompleteCourseResult:
    """Mark the learner's enrollment as completed (idempotent if already completed)."""
    c_row = await db.execute(
        select(Course).where(Course.id == course_id, Course.deleted_at.is_(None)),
    )
    course = c_row.scalar_one_or_none()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    e_row = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course_id,
        ),
    )
    en = e_row.scalar_one_or_none()
    if en is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course",
        )
    now = datetime.now(timezone.utc)
    if en.status == EnrollmentStatus.COMPLETED:
        return CompleteCourseResult(
            completed=True,
            completion_date=en.completed_at or now,
        )

    if en.status not in (EnrollmentStatus.ENROLLED, EnrollmentStatus.IN_PROGRESS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enrollment cannot be completed",
        )
    en.status = EnrollmentStatus.COMPLETED
    en.completed_at = now
    await db.commit()
    await db.refresh(en)
    return CompleteCourseResult(completed=True, completion_date=en.completed_at)
