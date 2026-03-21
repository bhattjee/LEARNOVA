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
