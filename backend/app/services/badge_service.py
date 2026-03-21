"""
badge_service.py — Badge level calculation based on total points.
Badge levels are used across reporting, profile, and quiz completion flows.
"""

from typing import Any, TypedDict


class BadgeDict(TypedDict):
    name: str
    min_points: int
    icon: str


BADGE_LEVELS: list[BadgeDict] = [
    {"name": "Newbie", "min_points": 0, "icon": "🌱"},
    {"name": "Explorer", "min_points": 20, "icon": "🧭"},
    {"name": "Achiever", "min_points": 40, "icon": "⭐"},
    {"name": "Specialist", "min_points": 60, "icon": "💎"},
    {"name": "Expert", "min_points": 80, "icon": "🏆"},
    {"name": "Master", "min_points": 100, "icon": "👑"},
]


def get_badge_for_points(points: int) -> BadgeDict:
    """Return the highest badge the user qualifies for."""
    p = max(0, points)
    qualified = [b for b in BADGE_LEVELS if p >= b["min_points"]]
    return max(qualified, key=lambda b: b["min_points"])


class NextBadgePayload(TypedDict):
    badge: BadgeDict
    points_to_next: int


def get_next_badge(points: int) -> NextBadgePayload | None:
    """
    Return the next tier and how many points are still needed to reach it,
    or None if the user is already at the highest badge (Master).
    """
    p = max(0, points)
    current = get_badge_for_points(p)
    higher = [b for b in BADGE_LEVELS if b["min_points"] > current["min_points"]]
    if not higher:
        return None
    nxt = min(higher, key=lambda b: b["min_points"])
    return {"badge": nxt, "points_to_next": nxt["min_points"] - p}


def get_badge_name(points: int) -> str:
    """Backward-compatible badge name string."""
    return get_badge_for_points(max(0, points))["name"]
