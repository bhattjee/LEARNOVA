/**
 * Learner-facing catalog and enrolled courses API.
 */
import { apiClient } from "@/services/apiClient";
import type { LearnerCoursesListResponse, PublicCoursesListResponse } from "@/types/course.types";

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
