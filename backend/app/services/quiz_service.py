"""
quiz_service.py — Business logic for quiz and question management.
Used exclusively by instructors and admins.
"""

import random
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enrollment_model import Enrollment
from app.models.lesson_model import Lesson, LessonType
from app.models.lesson_progress_model import LessonProgress
from app.models.quiz_model import Question, QuestionOption, Quiz, QuizAnswer, QuizAttempt
from app.models.user_model import User
from app.schemas.quiz_schema import (
    BadgeInfo,
    CreateQuizRequest,
    NextBadgeInfo,
    OptionDetail,
    QuestionDetail,
    QuizDetail,
    QuizIntroResponse,
    QuizItem,
    SaveQuestionsRequest,
    StartAttemptOption,
    StartAttemptQuestion,
    StartAttemptResponse,
    SubmitAnswerRequest,
    SubmitResult,
    UpdateQuizRequest,
)
from app.services.badge_service import get_badge_for_points, get_badge_name, get_next_badge
from app.services.course_service import _load_course_for_staff
from app.services.progress_service import complete_lesson


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


# —— Learner side — playback logic ——


async def get_quiz_intro(db: AsyncSession, quiz_id: uuid.UUID, user: User) -> QuizIntroResponse:
    quiz = await _get_quiz_or_404(db, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    # Count questions
    q_count = await db.scalar(
        select(func.count(Question.id)).where(
            Question.quiz_id == quiz_id, Question.deleted_at.is_(None)
        )
    )

    # Attempts
    result = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == user.id)
        .order_by(QuizAttempt.attempt_number.desc())
    )
    attempts = result.scalars().all()
    user_attempt_count = len(attempts)
    last_attempt_score = attempts[0].score_percentage if attempts else None

    return QuizIntroResponse(
        quiz_id=quiz.id,
        title=quiz.title,
        total_questions=int(q_count or 0),
        allows_multiple_attempts=True,
        user_attempt_count=user_attempt_count,
        last_attempt_score=last_attempt_score,
    )


async def start_quiz_attempt(db: AsyncSession, quiz_id: uuid.UUID, user: User) -> StartAttemptResponse:
    quiz = await _get_quiz_or_404(db, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    # Current attempts
    count = await db.scalar(
        select(func.count(QuizAttempt.id)).where(
            QuizAttempt.quiz_id == quiz_id, QuizAttempt.user_id == user.id
        )
    )

    # Create new attempt
    attempt = QuizAttempt(
        user_id=user.id,
        quiz_id=quiz_id,
        attempt_number=int(count or 0) + 1,
        started_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    await db.flush()

    # Load questions + options
    result = await db.execute(
        select(Question)
        .where(Question.quiz_id == quiz_id, Question.deleted_at.is_(None))
        .options(selectinload(Question.options))
    )
    questions = list(result.scalars().all())
    random.shuffle(questions)

    resp_questions = []
    for q in questions:
        opts = list(q.options)
        random.shuffle(opts)
        resp_questions.append(
            StartAttemptQuestion(
                id=q.id,
                text=q.text,
                options=[StartAttemptOption(id=o.id, text=o.text) for o in opts],
            )
        )

    await db.commit()
    return StartAttemptResponse(attempt_id=attempt.id, questions=resp_questions)


async def submit_quiz(
    db: AsyncSession,
    attempt_id: uuid.UUID,
    user: User,
    data: SubmitAnswerRequest,
) -> SubmitResult:
    # Load attempt
    result = await db.execute(
        select(QuizAttempt).where(QuizAttempt.id == attempt_id, QuizAttempt.user_id == user.id)
    )
    attempt = result.scalar_one_or_none()
    if not attempt or attempt.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid active attempt not found",
        )

    # Load quiz for points config
    quiz = await _get_quiz_or_404(db, attempt.quiz_id)
    assert quiz

    # Load all questions and correct answers for this quiz
    q_result = await db.execute(
        select(Question)
        .where(Question.quiz_id == attempt.quiz_id, Question.deleted_at.is_(None))
        .options(selectinload(Question.options))
    )
    questions = q_result.scalars().all()
    q_map = {q.id: q for q in questions}
    total_questions = len(questions)

    if total_questions == 0:
        raise HTTPException(status_code=400, detail="Quiz has no questions")

    correct_count = 0
    user_ans_map = {a.question_id: a.selected_option_ids for a in data.answers}

    for q_id, q in q_map.items():
        correct_ids = sorted([o.id for o in q.options if o.is_correct])
        user_ids = sorted(user_ans_map.get(q_id, []))
        is_correct = correct_ids == user_ids
        if is_correct:
            correct_count += 1

        db.add(
            QuizAnswer(
                attempt_id=attempt.id,
                question_id=q_id,
                selected_option_ids=user_ids,
                is_correct=is_correct,
            )
        )

    score_pct = (correct_count / total_questions) * 100
    attempt.score_percentage = score_pct
    attempt.completed_at = datetime.now(timezone.utc)

    # Points logic
    points = 0
    if score_pct >= 80:  # Passing score threshold? Placeholder: if they get points at all
        if attempt.attempt_number == 1:
            points = quiz.attempt_1_points
        elif attempt.attempt_number == 2:
            points = quiz.attempt_2_points
        elif attempt.attempt_number == 3:
            points = quiz.attempt_3_points
        else:
            points = quiz.attempt_4plus_points
    
    # Only award points if this is a better or equal score? 
    # Simplest: award points once per quiz success, or update based on rules.
    # Instruction says: "Points awarded depend on attempt number". 
    # Usually you only get points for the first "pass" or highest score.
    # Let's check for previous successful attempts.
    prev_success = await db.scalar(
        select(func.count(QuizAttempt.id)).where(
            QuizAttempt.quiz_id == attempt.quiz_id,
            QuizAttempt.user_id == user.id,
            QuizAttempt.points_awarded > 0,
            QuizAttempt.id != attempt_id
        )
    )
    
    if prev_success:
        points = 0 # Already earned points for this quiz
    
    attempt.points_awarded = points
    
    old_points = user.total_points
    user.total_points += points
    new_points = user.total_points
    
    old_badge_name = get_badge_name(old_points)
    new_badge_name = get_badge_name(new_points)
    badge_unlocked = new_badge_name if old_badge_name != new_badge_name else None

    cur_b = get_badge_for_points(new_points)
    current_badge = BadgeInfo(
        name=cur_b["name"],
        min_points=cur_b["min_points"],
        icon=cur_b["icon"],
    )
    nxt_raw = get_next_badge(new_points)
    next_badge_model: NextBadgeInfo | None = None
    points_to_next_val: int | None = None
    if nxt_raw is not None:
        nb = nxt_raw["badge"]
        ptn = nxt_raw["points_to_next"]
        next_badge_model = NextBadgeInfo(
            name=nb["name"],
            min_points=nb["min_points"],
            icon=nb["icon"],
            points_to_next=ptn,
        )
        points_to_next_val = ptn

    # Mark quiz lesson as completed
    # We need the lesson_id linked to this quiz.
    # Quizzes are linked to lessons in 'Lesson.quiz_id'.
    l_result = await db.execute(
        select(Lesson).where(Lesson.quiz_id == attempt.quiz_id, Lesson.deleted_at.is_(None))
    )
    lesson = l_result.scalar_one_or_none()
    if lesson:
        # We use progress_service to complete it
        # Note: we need enrollment_id, but complete_lesson fetches it.
        # We just need course_id.
        await complete_lesson(db, user, lesson.id, lesson.course_id, time_spent_seconds=0)

    await db.commit()

    return SubmitResult(
        score_percentage=score_pct,
        points_awarded=points,
        total_points_now=new_points,
        correct_count=correct_count,
        total_questions=total_questions,
        attempt_number=attempt.attempt_number,
        new_badge=badge_unlocked,
        current_badge=current_badge,
        next_badge=next_badge_model,
        points_to_next=points_to_next_val,
    )

