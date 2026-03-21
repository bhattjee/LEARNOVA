/**
 * quizService.ts — Quiz builder API (admin/instructor).
 */
import { apiClient } from "@/services/apiClient";
import type {
  CreateQuizRequest,
  QuizDetail,
  QuizDetailEnvelope,
  QuizItem,
  QuizItemEnvelope,
  QuizzesListResponse,
  SaveQuestionsRequest,
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
