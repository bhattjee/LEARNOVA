import { apiClient } from "@/services/apiClient";
import type { LessonItem, LessonItemEnvelope } from "@/types/lesson.types";
import type { CompleteLessonResult, LessonProgressResponse } from "@/types/progress.types";

export async function startLesson(body: { lesson_id: string; course_id: string }): Promise<LessonProgressResponse> {
  const res = await apiClient.post<{ data: LessonProgressResponse }>("/api/v1/progress/start", body);
  return res.data.data;
}

export async function completeLesson(body: {
  lesson_id: string;
  course_id: string;
  time_spent_seconds: number;
}): Promise<CompleteLessonResult> {
  const res = await apiClient.post<{ data: CompleteLessonResult }>("/api/v1/progress/complete", body);
  return res.data.data;
}

export async function getPlayerLesson(courseId: string, lessonId: string): Promise<LessonItem> {
  const res = await apiClient.get<LessonItemEnvelope>(
    `/api/v1/progress/courses/${courseId}/lessons/${lessonId}/player`,
  );
  return res.data.data;
}
