"""
review_schema.py — Pydantic schemas for course ratings and reviews.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, conint
from app.schemas.auth_schema import UserPublic

class CreateReviewRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)

class ReviewItem(BaseModel):
    id: UUID
    user: UserPublic
    rating: int
    comment: str | None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewsResponse(BaseModel):
    data: list[ReviewItem]
    average_rating: float
    total: int
