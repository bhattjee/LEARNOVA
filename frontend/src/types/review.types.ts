import { UserPublic } from "./auth.types";

export interface ReviewItem {
  id: string;
  user: UserPublic;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReviewsResponse {
  data: ReviewItem[];
  average_rating: number;
  total: number;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}
