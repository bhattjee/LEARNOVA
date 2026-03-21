from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user_model import User, UserRole
from app.schemas.review_schema import CreateReviewRequest, ReviewItem, ReviewsResponse
from app.services.review_service import (
    create_review,
    delete_review,
    get_reviews,
    update_review,
)

router = APIRouter()

LearnerUser = Annotated[User, Depends(require_roles(UserRole.LEARNER))]


@router.get("/{id}/reviews", response_model=ReviewsResponse)
async def list_reviews_route(
    id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    limit: int = 10,
) -> ReviewsResponse:
    return await get_reviews(db, id, page, limit)


@router.post("/{id}/reviews", response_model=ReviewItem, status_code=status.HTTP_201_CREATED)
async def create_review_route(
    id: UUID,
    current_user: LearnerUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: CreateReviewRequest,
) -> ReviewItem:
    return await create_review(db, id, current_user, body)


@router.put("/{id}/reviews/{review_id}", response_model=ReviewItem)
async def update_review_route(
    id: UUID,  # course_id from path
    review_id: UUID,
    current_user: LearnerUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    body: CreateReviewRequest,
) -> ReviewItem:
    return await update_review(db, review_id, current_user, body)


@router.delete("/{id}/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review_route(
    id: UUID,  # course_id from path
    review_id: UUID,
    current_user: LearnerUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await delete_review(db, review_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
