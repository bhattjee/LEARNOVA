"""
quiz_service.py — Business logic for quiz and question management.
Used exclusively by instructors and admins.
"""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.quiz_model import Question, QuestionOption, Quiz
from app.models.user_model import User
from app.schemas.quiz_schema import (
    CreateQuizRequest,
    OptionDetail,
    QuestionDetail,
    QuizDetail,
    QuizItem,
    SaveQuestionsRequest,
    UpdateQuizRequest,
)
from app.services.course_service import _load_course_for_staff


def _validate_point_tiers(a1: int, a2: int, a3: int, a4: int) -> None:
    if a1 < 0 or a2 < 0 or a3 < 0 or a4 < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Point values must be non-negative.",
        )
    if not (a1 >= a2 >= a3 >= a4):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Point rewards must be non-increasing (1st ≥ 2nd ≥ 3rd ≥ 4th+).",
        )


async def _get_quiz_or_404(db: AsyncSession, quiz_id: uuid.UUID) -> Quiz | None:
    result = await db.execute(
        select(Quiz).where(Quiz.id == quiz_id, Quiz.deleted_at.is_(None)),
    )
    return result.scalar_one_or_none()


async def _assert_quiz_course_access(db: AsyncSession, quiz: Quiz, user: User) -> None:
    course = await _load_course_for_staff(db, quiz.course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )


def _quiz_to_item(quiz: Quiz, question_count: int) -> QuizItem:
    return QuizItem(
        id=quiz.id,
        title=quiz.title,
        question_count=question_count,
        attempt_1_points=quiz.attempt_1_points,
        attempt_2_points=quiz.attempt_2_points,
        attempt_3_points=quiz.attempt_3_points,
        attempt_4plus_points=quiz.attempt_4plus_points,
    )


def _quiz_to_detail(quiz: Quiz) -> QuizDetail:
    active = [q for q in quiz.questions if q.deleted_at is None]
    active.sort(key=lambda x: (x.sort_order, x.created_at))
    qdetails: list[QuestionDetail] = []
    for q in active:
        opts = sorted(q.options, key=lambda o: (o.sort_order, o.created_at))
        qdetails.append(
            QuestionDetail(
                id=q.id,
                text=q.text,
                sort_order=q.sort_order,
                options=[
                    OptionDetail(
                        id=o.id,
                        text=o.text,
                        is_correct=o.is_correct,
                        sort_order=o.sort_order,
                    )
                    for o in opts
                ],
            )
        )
    return QuizDetail(
        id=quiz.id,
        title=quiz.title,
        attempt_1_points=quiz.attempt_1_points,
        attempt_2_points=quiz.attempt_2_points,
        attempt_3_points=quiz.attempt_3_points,
        attempt_4plus_points=quiz.attempt_4plus_points,
        questions=qdetails,
    )


async def get_quizzes_for_course(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
) -> list[QuizItem]:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    cnt_sq = (
        select(
            Question.quiz_id.label("qz"),
            func.count(Question.id).label("qc"),
        )
        .where(Question.deleted_at.is_(None))
        .group_by(Question.quiz_id)
        .subquery()
    )
    result = await db.execute(
        select(Quiz, func.coalesce(cnt_sq.c.qc, 0).label("qcount"))
        .outerjoin(cnt_sq, cnt_sq.c.qz == Quiz.id)
        .where(Quiz.course_id == course_id, Quiz.deleted_at.is_(None))
        .order_by(Quiz.created_at),
    )
    rows = result.all()
    return [_quiz_to_item(q, int(c)) for q, c in rows]


async def create_quiz(
    db: AsyncSession,
    course_id: uuid.UUID,
    user: User,
    data: CreateQuizRequest,
) -> QuizItem:
    course = await _load_course_for_staff(db, course_id, user)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    quiz = Quiz(
        course_id=course_id,
        title=data.title,
    )
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return _quiz_to_item(quiz, 0)


async def get_quiz_detail(
    db: AsyncSession,
    quiz_id: uuid.UUID,
    user: User,
) -> QuizDetail:
    result = await db.execute(
        select(Quiz)
        .where(Quiz.id == quiz_id, Quiz.deleted_at.is_(None))
        .options(
            selectinload(Quiz.questions).selectinload(Question.options),
        ),
    )
    quiz = result.scalar_one_or_none()
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    await _assert_quiz_course_access(db, quiz, user)
    return _quiz_to_detail(quiz)


async def update_quiz(
    db: AsyncSession,
    quiz_id: uuid.UUID,
    user: User,
    data: UpdateQuizRequest,
) -> QuizDetail:
    quiz = await _get_quiz_or_404(db, quiz_id)
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    await _assert_quiz_course_access(db, quiz, user)
    payload = data.model_dump(exclude_unset=True)
    if "title" in payload and payload["title"] is not None:
        quiz.title = payload["title"].strip()
    if "attempt_1_points" in payload and payload["attempt_1_points"] is not None:
        quiz.attempt_1_points = payload["attempt_1_points"]
    if "attempt_2_points" in payload and payload["attempt_2_points"] is not None:
        quiz.attempt_2_points = payload["attempt_2_points"]
    if "attempt_3_points" in payload and payload["attempt_3_points"] is not None:
        quiz.attempt_3_points = payload["attempt_3_points"]
    if "attempt_4plus_points" in payload and payload["attempt_4plus_points"] is not None:
        quiz.attempt_4plus_points = payload["attempt_4plus_points"]

    _validate_point_tiers(
        quiz.attempt_1_points,
        quiz.attempt_2_points,
        quiz.attempt_3_points,
        quiz.attempt_4plus_points,
    )
    await db.commit()
    return await get_quiz_detail(db, quiz_id, user)


async def delete_quiz(
    db: AsyncSession,
    quiz_id: uuid.UUID,
    user: User,
) -> None:
    quiz = await _get_quiz_or_404(db, quiz_id)
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    await _assert_quiz_course_access(db, quiz, user)
    quiz.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def save_questions(
    db: AsyncSession,
    quiz_id: uuid.UUID,
    user: User,
    data: SaveQuestionsRequest,
) -> QuizDetail:
    quiz = await _get_quiz_or_404(db, quiz_id)
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    await _assert_quiz_course_access(db, quiz, user)

    result = await db.execute(
        select(Question).where(Question.quiz_id == quiz_id, Question.deleted_at.is_(None)),
    )
    old_questions = list(result.scalars().all())
    now = datetime.now(timezone.utc)
    old_ids = [q.id for q in old_questions]
    if old_ids:
        await db.execute(delete(QuestionOption).where(QuestionOption.question_id.in_(old_ids)))
        for q in old_questions:
            q.deleted_at = now

    for i, qin in enumerate(data.questions):
        q = Question(
            quiz_id=quiz_id,
            text=qin.text,
            sort_order=i,
        )
        db.add(q)
        await db.flush()
        for j, oin in enumerate(qin.options):
            db.add(
                QuestionOption(
                    question_id=q.id,
                    text=oin.text,
                    is_correct=oin.is_correct,
                    sort_order=j,
                )
            )

    await db.commit()
    return await get_quiz_detail(db, quiz_id, user)

