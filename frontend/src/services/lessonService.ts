/**
 * lessonService.ts — Lesson & attachment API (admin/instructor).
 */
import { apiClient } from "@/services/apiClient";
import type {
  AttachmentItem,
  AttachmentItemEnvelope,
  CreateAttachmentRequest,
  CreateLessonRequest,
  LessonItem,
  LessonItemEnvelope,
  LessonsListResponse,
  UpdateLessonRequest,
} from "@/types/lesson.types";

export async function getLessons(courseId: string): Promise<LessonItem[]> {
  const res = await apiClient.get<LessonsListResponse>(`/api/v1/courses/${courseId}/lessons`);
  return res.data.data;
}

export async function getLesson(lessonId: string): Promise<LessonItem> {
  const res = await apiClient.get<LessonItemEnvelope>(`/api/v1/lessons/${lessonId}`);
  return res.data.data;
}

export async function createLesson(courseId: string, body: CreateLessonRequest): Promise<LessonItem> {
  const res = await apiClient.post<LessonItemEnvelope>(`/api/v1/courses/${courseId}/lessons`, body);
  return res.data.data;
}

export async function updateLesson(lessonId: string, body: UpdateLessonRequest): Promise<LessonItem> {
  const res = await apiClient.put<LessonItemEnvelope>(`/api/v1/lessons/${lessonId}`, body);
  return res.data.data;
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await apiClient.delete(`/api/v1/lessons/${lessonId}`);
}

export async function reorderLessons(courseId: string, lessonIds: string[]): Promise<LessonItem[]> {
  const res = await apiClient.put<LessonsListResponse>(`/api/v1/courses/${courseId}/lessons/reorder`, {
    lesson_ids: lessonIds,
  });
  return res.data.data;
}

export async function addAttachment(
  lessonId: string,
  body: CreateAttachmentRequest,
): Promise<AttachmentItem> {
  const res = await apiClient.post<AttachmentItemEnvelope>(
    `/api/v1/lessons/${lessonId}/attachments`,
    body,
  );
  return res.data.data;
}

export async function deleteAttachment(lessonId: string, attachmentId: string): Promise<void> {
  await apiClient.delete(`/api/v1/lessons/${lessonId}/attachments/${attachmentId}`);
}
