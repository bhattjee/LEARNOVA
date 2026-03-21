export interface LearnerBadgeLevel {
  id: string;
  name: string;
  thresholdPoints: number;
}

/** Gamification ladder (UI-only until backend badge API exists). */
export const LEARNER_BADGE_LEVELS: LearnerBadgeLevel[] = [
  { id: "starter", name: "Starter", thresholdPoints: 0 },
  { id: "explorer", name: "Explorer", thresholdPoints: 50 },
  { id: "achiever", name: "Achiever", thresholdPoints: 200 },
  { id: "scholar", name: "Scholar", thresholdPoints: 500 },
  { id: "master", name: "Master", thresholdPoints: 1000 },
];

export function learnerBadgeState(points: number) {
  const sorted = [...LEARNER_BADGE_LEVELS].sort((a, b) => a.thresholdPoints - b.thresholdPoints);
  let currentIdx = 0;
  for (let i = 0; i < sorted.length; i += 1) {
    if (points >= sorted[i].thresholdPoints) {
      currentIdx = i;
    }
  }
  const current = sorted[currentIdx];
  const next = sorted[currentIdx + 1] ?? null;
  const progressToNext =
    next === null
      ? 1
      : Math.min(
          1,
          (points - current.thresholdPoints) / (next.thresholdPoints - current.thresholdPoints),
        );
  const pointsToNext = next === null ? 0 : Math.max(0, next.thresholdPoints - points);
  return { sorted, current, next, currentIdx, progressToNext, pointsToNext };
}
