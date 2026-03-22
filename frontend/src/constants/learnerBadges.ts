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
  const badgeCurrent = getBadgeForPoints(points);
  const currentIdx = sorted.findIndex((l) => l.name === badgeCurrent.name);
  const safeIdx = currentIdx >= 0 ? currentIdx : 0;
  const nextInfo = getNextBadge(points);
  const next = nextInfo
    ? sorted.find((l) => l.name === nextInfo.badge.name) ?? null
    : null;
  const pointsToNext = nextInfo?.pointsNeeded ?? 0;

  let progressToNext = 1;
  if (nextInfo && next) {
    const denom = next.thresholdPoints - badgeCurrent.min_points;
    if (denom > 0) {
      progressToNext = Math.min(1, Math.max(0, (points - badgeCurrent.min_points) / denom));
    }
  }

  return {
    sorted,
    current: sorted[safeIdx] ?? sorted[0],
    next,
    currentIdx: safeIdx,
    progressToNext: Number.isFinite(progressToNext) ? progressToNext : 0,
    pointsToNext,
  };
}
