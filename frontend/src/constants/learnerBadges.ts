import { BADGE_LEVELS, getBadgeForPoints, getNextBadge } from "@/utils/badgeUtils";

export interface LearnerBadgeLevel {
  id: string;
  name: string;
  thresholdPoints: number;
}

/** Ladder aligned with `badgeUtils.BADGE_LEVELS` for profile UI. */
export const LEARNER_BADGE_LEVELS: LearnerBadgeLevel[] = BADGE_LEVELS.map((b) => ({
  id: b.name.toLowerCase(),
  name: b.name,
  thresholdPoints: b.min_points,
}));

export function learnerBadgeState(points: number) {
  const sorted = [...LEARNER_BADGE_LEVELS].sort((a, b) => a.thresholdPoints - b.thresholdPoints);
  const current = getBadgeForPoints(points);
  const currentIdx = sorted.findIndex((l) => l.name === current.name);
  const safeIdx = currentIdx >= 0 ? currentIdx : 0;
  const nextInfo = getNextBadge(points);
  const next = nextInfo
    ? sorted.find((l) => l.name === nextInfo.badge.name) ?? null
    : null;
  const pointsToNext = nextInfo?.pointsNeeded ?? 0;
  const progressToNext =
    !nextInfo || !next
      ? 1
      : Math.min(
          1,
          (points - current.min_points) / (next.thresholdPoints - current.min_points),
        );
  return {
    sorted,
    current: sorted[safeIdx] ?? sorted[0],
    next,
    currentIdx: safeIdx,
    progressToNext,
    pointsToNext,
  };
}
