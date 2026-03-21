"""
quiz_schema.py — Pydantic schemas for quiz builder operations.
Used by instructors to create and edit quizzes and their questions.
"""

from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

# —— List / item ——


class QuizItem(BaseModel):
    id: UUID
    title: str
    question_count: int
    attempt_1_points: int
    attempt_2_points: int
    attempt_3_points: int
    attempt_4plus_points: int


class QuizzesListResponse(BaseModel):
    data: list[QuizItem]


class QuizItemEnvelope(BaseModel):
    data: QuizItem


# —— Create / update metadata ——


class CreateQuizRequest(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=500)]

    @field_validator("title")
    @classmethod
    def strip_title(cls, v: str) -> str:
        return v.strip()


class UpdateQuizRequest(BaseModel):
    title: Annotated[str | None, Field(None, min_length=1, max_length=500)] = None
    attempt_1_points: int | None = None
    attempt_2_points: int | None = None
    attempt_3_points: int | None = None
    attempt_4plus_points: int | None = None

    @field_validator("title")
    @classmethod
    def strip_title(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip()


# —— Detail tree ——


class OptionDetail(BaseModel):
    id: UUID
    text: str
    is_correct: bool
    sort_order: int


class QuestionDetail(BaseModel):
    id: UUID
    text: str
    sort_order: int
    options: list[OptionDetail]


class QuizDetail(BaseModel):
    id: UUID
    title: str
    attempt_1_points: int
    attempt_2_points: int
    attempt_3_points: int
    attempt_4plus_points: int
    questions: list[QuestionDetail]


class QuizDetailEnvelope(BaseModel):
    data: QuizDetail


# —— Save all questions ——


class SaveQuestionOptionIn(BaseModel):
    text: Annotated[str, Field(min_length=1, max_length=1000)]
    is_correct: bool

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()


class SaveQuestionIn(BaseModel):
    text: Annotated[str, Field(min_length=1)]
    options: list[SaveQuestionOptionIn]

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()

    @field_validator("options")
    @classmethod
    def options_count(cls, v: list[SaveQuestionOptionIn]) -> list[SaveQuestionOptionIn]:
        if len(v) < 2:
            raise ValueError("Each question must have at least 2 options")
        if len(v) > 8:
            raise ValueError("Each question may have at most 8 options")
        return v

    @model_validator(mode="after")
    def exactly_one_correct(self) -> "SaveQuestionIn":
        correct = sum(1 for o in self.options if o.is_correct)
        if correct != 1:
            raise ValueError("Each question must have exactly one correct option")
        return self


class SaveQuestionsRequest(BaseModel):
    questions: list[SaveQuestionIn]

    @field_validator("questions")
    @classmethod
    def at_least_one_question(cls, v: list[SaveQuestionIn]) -> list[SaveQuestionIn]:
        if len(v) < 1:
            raise ValueError("At least one question is required")
        return v


# —— Learner / Playback ——


class QuizIntroResponse(BaseModel):
    quiz_id: UUID
    title: str
    total_questions: int
    allows_multiple_attempts: bool = True
    user_attempt_count: int
    last_attempt_score: float | None = None


class StartAttemptOption(BaseModel):
    id: UUID
    text: str


class StartAttemptQuestion(BaseModel):
    id: UUID
    text: str
    options: list[StartAttemptOption]


class StartAttemptResponse(BaseModel):
    attempt_id: UUID
    questions: list[StartAttemptQuestion]


class SubmitAnswerItem(BaseModel):
    question_id: UUID
    selected_option_ids: list[UUID]


class SubmitAnswerRequest(BaseModel):
    answers: list[SubmitAnswerItem]


class BadgeInfo(BaseModel):
    name: str
    min_points: int
    icon: str


class NextBadgeInfo(BaseModel):
    name: str
    min_points: int
    icon: str
    points_to_next: int


class SubmitResult(BaseModel):
    score_percentage: float
    points_awarded: int
    total_points_now: int
    correct_count: int
    total_questions: int
    attempt_number: int
    new_badge: str | None = None
    current_badge: BadgeInfo
    next_badge: NextBadgeInfo | None = None
    points_to_next: int | None = None


class SubmitResultEnvelope(BaseModel):
    data: SubmitResult
