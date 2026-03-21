export interface Badge {
  name: string;
  min_points: number;
  icon: string;
}

export const BADGE_LEVELS: Badge[] = [
  { name: "Newbie", min_points: 0, icon: "🌱" },
  { name: "Explorer", min_points: 20, icon: "🧭" },
  { name: "Achiever", min_points: 40, icon: "⭐" },
  { name: "Specialist", min_points: 60, icon: "💎" },
  { name: "Expert", min_points: 80, icon: "🏆" },
  { name: "Master", min_points: 100, icon: "👑" },
];

export function getBadgeForPoints(points: number): Badge {
  const p = Math.max(0, points);
  const qualified = BADGE_LEVELS.filter((b) => p >= b.min_points);
  return qualified.reduce((a, b) => (b.min_points > a.min_points ? b : a));
}

export function getNextBadge(points: number): { badge: Badge; pointsNeeded: number } | null {
  const p = Math.max(0, points);
  const current = getBadgeForPoints(p);
  const higher = BADGE_LEVELS.filter((b) => b.min_points > current.min_points);
  if (higher.length === 0) {
    return null;
  }
  const next = higher.reduce((a, b) => (b.min_points < a.min_points ? b : a));
  return { badge: next, pointsNeeded: next.min_points - p };
}

export function getBadgeColor(badgeName: string): string {
  if (badgeName === "Master" || badgeName === "Expert") {
    return "#7632EC";
  }
  return "#1D4ED8";
}
