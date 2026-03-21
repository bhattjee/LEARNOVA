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
