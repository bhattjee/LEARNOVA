"""
reporting_schema.py — Pydantic schemas for the reporting dashboard.
Returns aggregated learner progress data per course.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ReportingRowStatus = Literal["yet_to_start", "in_progress", "completed"]


class ReportingOverview(BaseModel):
    total_participants: int
    yet_to_start: int
    in_progress: int
    completed: int


class ReportingRow(BaseModel):
    sr_no: int
    course_name: str
    participant_name: str
    participant_email: str
    enrolled_date: datetime
    start_date: datetime | None
    time_spent_seconds: int
    completion_percentage: float
    completed_date: datetime | None
    status: ReportingRowStatus


class ReportingResponse(BaseModel):
    overview: ReportingOverview
    rows: list[ReportingRow]
    total: int
    page: int
    limit: int
