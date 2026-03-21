import type { UserPublic } from "@/types/auth.types";

export interface CourseListItem {
  id: string;
  title: string;
  tags: string[];
  cover_image_url: string | null;
  is_published: boolean;
  views_count: number;
  total_lessons_count: number;
  total_duration_seconds: number;
  created_at: string;
}

export interface CreateCourseRequest {
  title: string;
}

export interface CourseListResponse {
  data: CourseListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CourseItemEnvelope {
  data: CourseListItem;
}

export interface KanbanColumn {
  id: string;
  label: string;
  courses: CourseListItem[];
}

export type CourseVisibility = "everyone" | "signed_in";
export type CourseAccessRule = "open" | "on_invitation" | "on_payment";

export interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  cover_image_url: string | null;
  is_published: boolean;
  website: string | null;
  visibility: CourseVisibility;
  access_rule: CourseAccessRule;
  price_cents: number | null;
  responsible_user_id: string | null;
  created_by: string;
  views_count: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  responsible_user: UserPublic | null;
  total_lessons_count: number;
  total_duration_seconds: number;
}

export interface CourseDetailEnvelope {
  data: CourseDetail;
}

export interface UpdateCourseRequest {
  title?: string;
  tags?: string[];
  website?: string | null;
  responsible_user_id?: string | null;
  visibility?: CourseVisibility;
  access_rule?: CourseAccessRule;
  price_cents?: number | null;
  description?: string | null;
  cover_image_url?: string | null;
}

export interface UpdateCourseOptionsRequest {
  visibility?: CourseVisibility;
  access_rule?: CourseAccessRule;
  price_cents?: number | null;
  responsible_user_id?: string | null;
  cover_image_url?: string | null;
}

export interface AddAttendeesResponse {
  added: number;
  already_enrolled: number;
  emails_queued: number;
}

export interface ContactAttendeesResponse {
  queued: number;
}

export interface CourseAttendeesResponse {
  data: UserPublic[];
}

export type LearnerCourseStatus = "not_enrolled" | "enrolled" | "in_progress" | "completed";

/** Published course in the public catalog (optional auth enriches learner fields). */
export interface PublicCourseItem {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  tags: string[];
  description_short: string | null;
  total_lessons_count: number;
  total_duration_seconds: number;
  visibility: CourseVisibility;
  access_rule: CourseAccessRule;
  price_cents: number | null;
  average_rating: number | null;
  learner_status: LearnerCourseStatus | null;
  completion_percentage: number | null;
}

export interface PublicCoursesListResponse {
  data: PublicCourseItem[];
}

/** Enrolled course for the current learner. */
export interface LearnerCourseItem extends Omit<PublicCourseItem, "learner_status"> {
  learner_status: LearnerCourseStatus;
  completion_percentage: number;
  enrolled_at: string;
}

export interface LearnerCoursesListResponse {
  data: LearnerCourseItem[];
}

export type LessonRowStatus = "not_started" | "in_progress" | "completed";

export type LessonRowType = "video" | "document" | "image" | "quiz";

export interface LessonProgressOutlineItem {
  lesson_id: string;
  title: string;
  type: LessonRowType;
  status: LessonRowStatus;
  sort_order: number;
  has_attachments: boolean;
  duration_seconds: number;
}

export interface CourseDetailForLearner {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[];
  visibility: CourseVisibility;
  access_rule: CourseAccessRule;
  price_cents: number | null;
  average_rating: number | null;
  total_duration_seconds: number;
  total_lessons: number;
  completed_count: number;
  incomplete_count: number;
  completion_percentage: number;
  lessons: LessonProgressOutlineItem[];
  enrollment_status: LearnerCourseStatus | null;
}

export interface CourseDetailForLearnerEnvelope {
  data: CourseDetailForLearner;
}
