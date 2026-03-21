"""lessons_and_attachments

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-03-21

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e5f6a7b8c9d0"
down_revision: str | None = "d4e5f6a7b8c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "lessons",
        sa.Column("title", sa.String(length=500), nullable=False, server_default="Untitled lesson"),
    )
    op.add_column(
        "lessons",
        sa.Column("type", sa.String(length=32), nullable=False, server_default="video"),
    )
    op.add_column("lessons", sa.Column("video_url", sa.String(length=1000), nullable=True))
    op.add_column("lessons", sa.Column("file_url", sa.String(length=1000), nullable=True))
    op.add_column(
        "lessons",
        sa.Column("allow_download", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column("lessons", sa.Column("description", sa.Text(), nullable=True))
    op.add_column(
        "lessons",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("lessons", sa.Column("responsible_user_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_lessons_responsible_user_id_users",
        "lessons",
        "users",
        ["responsible_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.alter_column("lessons", "title", server_default=None)
    op.alter_column("lessons", "type", server_default=None)
    op.alter_column("lessons", "allow_download", server_default=None)
    op.alter_column("lessons", "sort_order", server_default=None)

    op.create_table(
        "lesson_attachments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("url", sa.String(length=1000), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
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
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_lesson_attachments_lesson_id"),
        "lesson_attachments",
        ["lesson_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_lesson_attachments_lesson_id"), table_name="lesson_attachments")
    op.drop_table("lesson_attachments")
    op.drop_constraint("fk_lessons_responsible_user_id_users", "lessons", type_="foreignkey")
    op.drop_column("lessons", "responsible_user_id")
    op.drop_column("lessons", "sort_order")
    op.drop_column("lessons", "description")
    op.drop_column("lessons", "allow_download")
    op.drop_column("lessons", "file_url")
    op.drop_column("lessons", "video_url")
    op.drop_column("lessons", "type")
    op.drop_column("lessons", "title")
