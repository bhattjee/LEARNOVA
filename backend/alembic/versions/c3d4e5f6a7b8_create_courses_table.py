"""create_courses_table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c3d4e5f6a7b8"
down_revision: str | None = "b2c3d4e5f6a7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "courses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("slug", sa.String(length=500), nullable=False),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String()),
            server_default=sa.text("'{}'::varchar[]"),
            nullable=False,
        ),
        sa.Column("cover_image_url", sa.String(length=500), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("visibility", sa.String(length=32), nullable=False, server_default="everyone"),
        sa.Column("access_rule", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("price_cents", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("responsible_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("views_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["responsible_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_courses_created_by"), "courses", ["created_by"], unique=False)
    op.create_index(op.f("ix_courses_slug"), "courses", ["slug"], unique=True)

    op.create_table(
        "lessons",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_lessons_course_id"), "lessons", ["course_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lessons_course_id"), table_name="lessons")
    op.drop_table("lessons")
    op.drop_index(op.f("ix_courses_slug"), table_name="courses")
    op.drop_index(op.f("ix_courses_created_by"), table_name="courses")
    op.drop_table("courses")
