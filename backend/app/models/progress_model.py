"""
progress_model.py — Lesson-level progress status enum for learner APIs.

Physical rows live in `lesson_progress` (see `lesson_progress_model.LessonProgress`),
scoped by enrollment_id. Status values below are derived or stored consistently with
completed_at and time_spent_seconds on those rows.
"""

from enum import Enum


class LessonStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
