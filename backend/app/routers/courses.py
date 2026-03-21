"""
courses.py — API routes for course management (instructor/admin).
Learner-facing catalog routes are separate.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_optional_user, require_roles
from app.models.user_model import User, UserRole
from app.schemas.course_schema import (
    AddAttendeesRequest,
    AddAttendeesResponse,
    CompleteCourseEnvelope,
    ContactAttendeesRequest,
    ContactAttendeesResponse,
    CourseAttendeesResponse,
    CourseDetailEnvelope,
    CourseDetailForLearnerEnvelope,
    CourseItemEnvelope,
    CourseListResponse,
    CreateCourseRequest,
    PublicCoursesListResponse,
    UpdateCourseOptions,
    UpdateCourseRequest,
)
from app.services.course_service import (
    add_attendees,
    complete_course_for_learner,
    contact_attendees,
    create_course,
    get_course_attendees,
    get_course_by_id,
    get_course_detail_for_learner,
    get_courses,
    get_public_courses,
    soft_delete_course,
    toggle_publish,
    update_course,
    update_course_options,
)

router = APIRouter()

StaffUser = Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.INSTRUCTOR))]
AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
LearnerUser = Annotated[User, Depends(require_roles(UserRole.LEARNER))]


@router.get("/public", response_model=PublicCoursesListResponse)
async def list_public_courses_route(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: OptionalUser,
    search: str | None = Query(None),
) -> PublicCoursesListResponse:
    items = await get_public_courses(db, current_user, search)
    return PublicCoursesListResponse(data=items)


@router.get("", response_model=CourseListResponse)
async def list_courses(
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> CourseListResponse:
    items, total = await get_courses(db, current_user, search, page, limit)
    return CourseListResponse(data=items, total=total, page=page, limit=limit)


@router.post("", response_model=CourseItemEnvelope, status_code=status.HTTP_201_CREATED)
async def create_course_route(
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: CreateCourseRequest,
) -> CourseItemEnvelope:
    item = await create_course(db, current_user, body)
    return CourseItemEnvelope(data=item)


@router.patch("/{course_id}/publish", response_model=CourseDetailEnvelope)
async def toggle_publish_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CourseDetailEnvelope:
    detail = await toggle_publish(db, course_id, current_user)
    return CourseDetailEnvelope(data=detail)


@router.put("/{course_id}/options", response_model=CourseDetailEnvelope)
async def update_course_options_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: UpdateCourseOptions,
) -> CourseDetailEnvelope:
    detail = await update_course_options(db, course_id, current_user, body)
    return CourseDetailEnvelope(data=detail)


@router.get("/{course_id}/attendees", response_model=CourseAttendeesResponse)
async def list_course_attendees_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CourseAttendeesResponse:
    users = await get_course_attendees(db, course_id, current_user)
    return CourseAttendeesResponse(data=users)


@router.post("/{course_id}/attendees", response_model=AddAttendeesResponse)
async def add_course_attendees_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: AddAttendeesRequest,
    background_tasks: BackgroundTasks,
) -> AddAttendeesResponse:
    return await add_attendees(db, course_id, current_user, body.emails, background_tasks)


@router.post("/{course_id}/contact", response_model=ContactAttendeesResponse)
async def contact_course_attendees_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: ContactAttendeesRequest,
    background_tasks: BackgroundTasks,
) -> ContactAttendeesResponse:
    return await contact_attendees(
        db,
        course_id,
        current_user,
        body.subject.strip(),
        body.body.strip(),
        background_tasks,
    )


@router.get("/{course_id}/learner-detail", response_model=CourseDetailForLearnerEnvelope)
async def get_course_learner_detail_route(
    course_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: OptionalUser,
) -> CourseDetailForLearnerEnvelope:
    detail = await get_course_detail_for_learner(db, course_id, current_user)
    return CourseDetailForLearnerEnvelope(data=detail)


@router.post("/{course_id}/complete", response_model=CompleteCourseEnvelope)
async def complete_course_route(
    course_id: UUID,
    current_user: LearnerUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CompleteCourseEnvelope:
    result = await complete_course_for_learner(db, course_id, current_user)
    return CompleteCourseEnvelope(data=result)


@router.get("/{course_id}", response_model=CourseDetailEnvelope)
async def get_course_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CourseDetailEnvelope:
    detail = await get_course_by_id(db, course_id, current_user)
    return CourseDetailEnvelope(data=detail)


@router.put("/{course_id}", response_model=CourseDetailEnvelope)
async def update_course_route(
    course_id: UUID,
    current_user: StaffUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: UpdateCourseRequest,
) -> CourseDetailEnvelope:
    detail = await update_course(db, course_id, current_user, body)
    return CourseDetailEnvelope(data=detail)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course_route(
    course_id: UUID,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await soft_delete_course(db, course_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
