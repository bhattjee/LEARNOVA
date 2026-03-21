export interface OptionDetail {
  id: string;
  text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface QuestionDetail {
  id: string;
  text: string;
  sort_order: number;
  options: OptionDetail[];
}

export interface QuizItem {
  id: string;
  title: string;
  question_count: number;
  attempt_1_points: number;
  attempt_2_points: number;
  attempt_3_points: number;
  attempt_4plus_points: number;
}

export interface QuizDetail {
  id: string;
  title: string;
  attempt_1_points: number;
  attempt_2_points: number;
  attempt_3_points: number;
  attempt_4plus_points: number;
  questions: QuestionDetail[];
}

export interface CreateQuizRequest {
  title: string;
}

export interface UpdateQuizRequest {
  title?: string;
  attempt_1_points?: number;
  attempt_2_points?: number;
  attempt_3_points?: number;
  attempt_4plus_points?: number;
}

export interface SaveQuestionOptionIn {
  text: string;
  is_correct: boolean;
}

export interface SaveQuestionIn {
  text: string;
  options: SaveQuestionOptionIn[];
}

export interface SaveQuestionsRequest {
  questions: SaveQuestionIn[];
}

export interface QuizzesListResponse {
  data: QuizItem[];
}

export interface QuizDetailEnvelope {
  data: QuizDetail;
}

export interface QuizItemEnvelope {
  data: QuizItem;
}

// —— Learner side — playback types ——

export interface QuizIntroResponse {
  quiz_id: string;
  title: string;
  total_questions: number;
  allows_multiple_attempts: boolean;
  user_attempt_count: number;
  last_attempt_score: number | null;
}

export interface StartAttemptOption {
  id: string;
  text: string;
}

export interface StartAttemptQuestion {
  id: string;
  text: string;
  options: StartAttemptOption[];
}

export interface StartAttemptResponse {
  attempt_id: string;
  questions: StartAttemptQuestion[];
}

export interface SubmitAnswerItem {
  question_id: string;
  selected_option_ids: string[];
}

export interface SubmitAnswerRequest {
  answers: SubmitAnswerItem[];
}

export interface QuizBadgeInfo {
  name: string;
  min_points: number;
  icon: string;
}

export interface QuizNextBadgeInfo {
  name: string;
  min_points: number;
  icon: string;
  points_to_next: number;
}

export interface SubmitResult {
  score_percentage: number;
  points_awarded: number;
  total_points_now: number;
  correct_count: number;
  total_questions: number;
  attempt_number: number;
  new_badge: string | null;
  current_badge: QuizBadgeInfo;
  next_badge: QuizNextBadgeInfo | null;
  points_to_next: number | null;
}

export interface SubmitResultEnvelope {
  data: SubmitResult;
}
