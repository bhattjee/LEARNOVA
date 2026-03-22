/**
 * Learner-facing catalog and enrolled courses API.
 */
import { apiClient } from "@/services/apiClient";
import type {
  CourseDetailForLearner,
  LearnerCoursesListResponse,
  PublicCoursesListResponse,
} from "@/types/course.types";

export async function getPublicCourses(params?: { search?: string }): Promise<PublicCoursesListResponse> {
  const res = await apiClient.get<PublicCoursesListResponse>("/api/v1/courses/public", {
    params: { search: params?.search?.trim() || undefined },
  });
  return res.data;
}

export async function getMyCourses(): Promise<LearnerCoursesListResponse> {
  const res = await apiClient.get<LearnerCoursesListResponse>("/api/v1/my-courses");
  return res.data;
}

export async function getCourseLearnerDetail(courseId: string): Promise<CourseDetailForLearner> {
  const res = await apiClient.get<{ data: CourseDetailForLearner }>(
    `/api/v1/courses/${courseId}/learner-detail`,
  );
  return res.data.data;
}

export interface CompleteCourseResult {
  completed: boolean;
  completion_date: string;
}

export async function completeLearnerCourse(courseId: string): Promise<CompleteCourseResult> {
  const res = await apiClient.post<{ data: CompleteCourseResult }>(`/api/v1/courses/${courseId}/complete`);
  return res.data.data;
}

/** Record enrollment after mock checkout (no real payment gateway). */
export async function purchaseCourse(courseId: string): Promise<void> {
  await apiClient.post(`/api/v1/courses/${courseId}/purchase`);
}
