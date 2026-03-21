import { apiClient } from "@/services/apiClient";
import type { 
  CreateReviewRequest, 
  ReviewItem, 
  ReviewsResponse 
} from "@/types/review.types";

export async function getReviews(
  courseId: string, 
  page = 1, 
  limit = 10
): Promise<ReviewsResponse> {
  const res = await apiClient.get<ReviewsResponse>(
    `/api/v1/courses/${courseId}/reviews`, 
    { params: { page, limit } }
  );
  return res.data;
}

export async function createReview(
  courseId: string, 
  body: CreateReviewRequest
): Promise<ReviewItem> {
  const res = await apiClient.post<ReviewItem>(
    `/api/v1/courses/${courseId}/reviews`, 
    body
  );
  return res.data;
}

export async function updateReview(
  courseId: string, 
  reviewId: string, 
  body: CreateReviewRequest
): Promise<ReviewItem> {
  const res = await apiClient.put<ReviewItem>(
    `/api/v1/courses/${courseId}/reviews/${reviewId}`, 
    body
  );
  return res.data;
}

export async function deleteReview(
  courseId: string, 
  reviewId: string
): Promise<void> {
  await apiClient.delete(`/api/v1/courses/${courseId}/reviews/${reviewId}`);
}
