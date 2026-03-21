/**
 * quizService.ts — Quiz builder API (admin/instructor).
 */
import { apiClient } from "@/services/apiClient";
import type {
  CreateQuizRequest,
  QuizDetail,
  QuizDetailEnvelope,
  QuizIntroResponse,
  QuizItem,
  QuizItemEnvelope,
  QuizzesListResponse,
  SaveQuestionsRequest,
  StartAttemptResponse,
  SubmitAnswerRequest,
  SubmitResult,
  SubmitResultEnvelope,
  UpdateQuizRequest,
} from "@/types/quiz.types";

export async function getQuizzes(courseId: string): Promise<QuizItem[]> {
  const res = await apiClient.get<QuizzesListResponse>(`/api/v1/courses/${courseId}/quizzes`);
  return res.data.data;
}

export async function createQuiz(courseId: string, body: CreateQuizRequest): Promise<QuizItem> {
  const res = await apiClient.post<QuizItemEnvelope>(`/api/v1/courses/${courseId}/quizzes`, body);
  return res.data.data;
}

export async function getQuiz(quizId: string): Promise<QuizDetail> {
  const res = await apiClient.get<QuizDetailEnvelope>(`/api/v1/quizzes/${quizId}`);
  return res.data.data;
}

export async function updateQuiz(quizId: string, body: UpdateQuizRequest): Promise<QuizDetail> {
  const res = await apiClient.put<QuizDetailEnvelope>(`/api/v1/quizzes/${quizId}`, body);
  return res.data.data;
}

export async function deleteQuiz(quizId: string): Promise<void> {
  await apiClient.delete(`/api/v1/quizzes/${quizId}`);
}

export async function saveQuizQuestions(quizId: string, body: SaveQuestionsRequest): Promise<QuizDetail> {
  const res = await apiClient.post<QuizDetailEnvelope>(`/api/v1/quizzes/${quizId}/questions`, body);
  return res.data.data;
}

// —— Learner side — playback functions ——

export async function getQuizIntro(quizId: string): Promise<QuizIntroResponse> {
  const res = await apiClient.get<QuizIntroResponse>(`/api/v1/quizzes/${quizId}/intro`);
  return res.data;
}

export async function startQuizAttempt(quizId: string): Promise<StartAttemptResponse> {
  const res = await apiClient.post<StartAttemptResponse>(`/api/v1/quizzes/${quizId}/start`);
  return res.data;
}

export async function submitQuiz(
  attemptId: string,
  body: SubmitAnswerRequest
): Promise<SubmitResult> {
  const res = await apiClient.post<SubmitResultEnvelope>(
    `/api/v1/quiz-attempts/${attemptId}/submit`,
    body
  );
  return res.data.data;
}
