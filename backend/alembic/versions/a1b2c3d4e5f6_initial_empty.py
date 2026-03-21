"""initial empty migration (no ORM models yet).

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-03-21

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """No-op until Phase 1 models are introduced."""
    pass


def downgrade() -> None:
    """No-op."""
    pass
