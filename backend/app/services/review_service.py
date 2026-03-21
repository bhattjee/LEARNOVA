"""
review_service.py — Business logic for submitting and listing course reviews.
Only enrolled learners can review.
"""

import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.review_model import Review
from app.models.enrollment_model import Enrollment
from app.models.user_model import User
from app.schemas.review_schema import CreateReviewRequest, ReviewItem, ReviewsResponse

async def get_reviews(
    db: AsyncSession, 
    course_id: uuid.UUID, 
    page: int = 1, 
    limit: int = 10
) -> ReviewsResponse:
    """
    Lists paginated reviews for a course and calculates average rating.
    """
    offset = (page - 1) * limit

    # Get reviews
    result = await db.execute(
        select(Review)
        .where(Review.course_id == course_id, Review.deleted_at.is_(None))
        .order_by(Review.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    reviews = result.scalars().all()

    # Get stats
    stats_result = await db.execute(
        select(
            func.count(Review.id),
            func.avg(Review.rating)
        ).where(Review.course_id == course_id, Review.deleted_at.is_(None))
    )
    total, avg_rating = stats_result.one()

    return ReviewsResponse(
        data=[ReviewItem.model_validate(r) for r in reviews],
        average_rating=float(avg_rating or 0),
        total=total
    )

async def create_review(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
    data: CreateReviewRequest
) -> ReviewItem:
    """
    Creates a new review if the user is enrolled and hasn't reviewed yet.
    """
    # Verify enrollment
    enrollment = await db.scalar(
        select(Enrollment).where(
            Enrollment.user_id == user.id,
            Enrollment.course_id == course_id
        )
    )
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only enrolled learners can review this course"
        )

    # Check for existing review
    existing = await db.scalar(
        select(Review).where(
            Review.user_id == user.id,
            Review.course_id == course_id,
            Review.deleted_at.is_(None)
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this course"
        )

    review = Review(
        user_id=user.id,
        course_id=course_id,
        rating=data.rating,
        comment=data.comment
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return ReviewItem.model_validate(review)

async def update_review(
    db: AsyncSession,
    review_id: uuid.UUID,
    user: User,
    data: CreateReviewRequest
) -> ReviewItem:
    """
    Updates an existing review owned by the user.
    """
    result = await db.execute(
        select(Review).where(
            Review.id == review_id,
            Review.user_id == user.id,
            Review.deleted_at.is_(None)
        )
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    review.rating = data.rating
    review.comment = data.comment
    await db.commit()
    await db.refresh(review)
    return ReviewItem.model_validate(review)

async def delete_review(
    db: AsyncSession,
    review_id: uuid.UUID,
    user: User
) -> None:
    """
    Soft-deletes a review owned by the user.
    """
    result = await db.execute(
        select(Review).where(
            Review.id == review_id,
            Review.user_id == user.id,
            Review.deleted_at.is_(None)
        )
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )

    review.deleted_at = datetime.now(timezone.utc)
    await db.commit()
