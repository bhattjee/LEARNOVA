/**
 * courseService.ts — API calls for course management (admin/instructor).
 */
import { apiClient } from "@/services/apiClient";
import type { UserPublic } from "@/types/auth.types";
import type {
  AddAttendeesResponse,
  ContactAttendeesResponse,
  CourseAttendeesResponse,
  CourseDetail,
  CourseDetailEnvelope,
  CourseItemEnvelope,
  CourseListResponse,
  CreateCourseRequest,
  CourseListItem,
  UpdateCourseOptionsRequest,
  UpdateCourseRequest,
} from "@/types/course.types";

export async function getCourses(params: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<CourseListResponse> {
  const res = await apiClient.get<CourseListResponse>("/api/v1/courses", {
    params: {
      search: params.search || undefined,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return res.data;
}

export async function createCourse(data: CreateCourseRequest): Promise<CourseListItem> {
  const res = await apiClient.post<CourseItemEnvelope>("/api/v1/courses", data);
  return res.data.data;
}

export async function getCourse(id: string): Promise<CourseDetail> {
  const res = await apiClient.get<CourseDetailEnvelope>(`/api/v1/courses/${id}`);
  return res.data.data;
}

export async function updateCourse(id: string, body: UpdateCourseRequest): Promise<CourseDetail> {
  const res = await apiClient.put<CourseDetailEnvelope>(`/api/v1/courses/${id}`, body);
  return res.data.data;
}

export async function toggleCoursePublish(id: string): Promise<CourseDetail> {
  const res = await apiClient.patch<CourseDetailEnvelope>(`/api/v1/courses/${id}/publish`);
  return res.data.data;
}

export async function updateCourseOptions(id: string, body: UpdateCourseOptionsRequest): Promise<CourseDetail> {
  const res = await apiClient.put<CourseDetailEnvelope>(`/api/v1/courses/${id}/options`, body);
  return res.data.data;
}

export async function getCourseAttendees(courseId: string): Promise<UserPublic[]> {
  const res = await apiClient.get<CourseAttendeesResponse>(`/api/v1/courses/${courseId}/attendees`);
  return res.data.data;
}

export async function addCourseAttendees(courseId: string, emails: string[]): Promise<AddAttendeesResponse> {
  const res = await apiClient.post<AddAttendeesResponse>(`/api/v1/courses/${courseId}/attendees`, { emails });
  return res.data;
}

export async function contactCourseAttendees(
  courseId: string,
  body: { subject: string; body: string },
): Promise<ContactAttendeesResponse> {
  const res = await apiClient.post<ContactAttendeesResponse>(`/api/v1/courses/${courseId}/contact`, body);
  return res.data;
}
