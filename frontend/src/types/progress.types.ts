export type LessonProgressStatusApi = "not_started" | "in_progress" | "completed";

export interface LessonProgressResponse {
  lesson_id: string;
  status: LessonProgressStatusApi;
  time_spent_seconds: number;
  completed_at: string | null;
}

export interface CompleteLessonResult {
  lesson_status: "completed";
  course_completion_percentage: number;
  all_completed: boolean;
  lesson_id: string;
  time_spent_seconds: number;
  completed_at: string | null;
}
