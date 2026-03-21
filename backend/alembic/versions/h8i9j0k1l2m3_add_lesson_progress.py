"""add_lesson_progress

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-03-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "h8i9j0k1l2m3"
down_revision: str | None = "g7h8i9j0k1l2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "lesson_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("enrollment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("time_spent_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["enrollment_id"], ["enrollments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("enrollment_id", "lesson_id", name="uq_lesson_progress_enrollment_lesson"),
    )
    op.create_index(op.f("ix_lesson_progress_enrollment_id"), "lesson_progress", ["enrollment_id"], unique=False)
    op.create_index(op.f("ix_lesson_progress_lesson_id"), "lesson_progress", ["lesson_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lesson_progress_lesson_id"), table_name="lesson_progress")
    op.drop_index(op.f("ix_lesson_progress_enrollment_id"), table_name="lesson_progress")
    op.drop_table("lesson_progress")
