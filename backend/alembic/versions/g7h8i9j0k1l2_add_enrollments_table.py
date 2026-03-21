"""add_enrollments_table

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-03-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "g7h8i9j0k1l2"
down_revision: str | None = "f6a7b8c9d0e1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "enrollments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("enrolled_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="enrolled"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["enrolled_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "course_id", name="uq_enrollments_user_course"),
    )
    op.create_index(op.f("ix_enrollments_user_id"), "enrollments", ["user_id"], unique=False)
    op.create_index(op.f("ix_enrollments_course_id"), "enrollments", ["course_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_enrollments_course_id"), table_name="enrollments")
    op.drop_index(op.f("ix_enrollments_user_id"), table_name="enrollments")
    op.drop_table("enrollments")
