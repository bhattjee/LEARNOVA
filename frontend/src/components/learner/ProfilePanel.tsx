import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { BadgeDisplay } from "@/components/learner/BadgeDisplay";
import { CircularProgressRing } from "@/components/learner/CircularProgressRing";
import { learnerBadgeState } from "@/constants/learnerBadges";
import type { UserPublic } from "@/types/auth.types";

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

interface ProfilePanelProps {
  user: UserPublic | null;
  isLoading?: boolean;
  /** Average enrolled course completion (0–100), shown as helper text — not the points ring. */
  averageCourseCompletionPct?: number | null;
}

export function ProfilePanel({ user, isLoading, averageCourseCompletionPct }: ProfilePanelProps) {
  const points = user?.total_points ?? 0;
  const { sorted, current, next, currentIdx, progressToNext, pointsToNext } = learnerBadgeState(points);

  const ringProgress = Math.min(1, Math.max(0, Number.isFinite(progressToNext) ? progressToNext : 0));

  if (isLoading || !user) {
    return (
      <aside className="w-full overflow-hidden rounded-2xl border border-brand-mid-grey/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] lg:w-[300px] lg:shrink-0">
        <div className="p-5">
          <Skeleton className="h-5 w-28" />
          <div className="mt-4 flex flex-col items-center">
            <Skeleton className="h-[152px] w-[152px] rounded-full" />
            <Skeleton className="mt-4 h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
        </div>
        <div className="border-t border-brand-mid-grey/80 bg-brand-light-grey/50 px-5 py-4">
          <Skeleton className="h-3 w-16" />
          <div className="mt-3 space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full overflow-hidden rounded-2xl border border-brand-mid-grey/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] lg:w-[300px] lg:shrink-0">
      <div className="p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-dark-grey">My profile</h2>

        <div className="mt-4 flex flex-col items-center text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-base font-bold text-primary shadow-inner"
            aria-hidden
          >
            {initials(user.full_name)}
          </div>
          <p className="mt-3 text-base font-bold text-brand-black">{user.full_name}</p>
          <p className="mt-0.5 max-w-[240px] truncate text-[13px] text-brand-dark-grey">{user.email}</p>
        </div>

        <div className="mt-6">
          <CircularProgressRing progress={ringProgress} size={168} strokeWidth={11}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark-grey">
              Total points
            </p>
            <p className="text-2xl font-extrabold tabular-nums text-primary">{points}</p>
            <p className="mt-1 text-sm font-bold text-status-warning">{current.name}</p>
          </CircularProgressRing>
          {averageCourseCompletionPct != null && averageCourseCompletionPct > 0 ? (
            <p className="mt-2 text-center text-[11px] text-brand-dark-grey">
              Avg. course progress{" "}
              <span className="font-semibold tabular-nums text-brand-black">
                {Math.round(averageCourseCompletionPct)}%
              </span>
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F5F0FF] px-3 py-2.5">
          <Trophy className="h-5 w-5 shrink-0 text-status-purple" aria-hidden />
          <div className="min-w-0 text-left">
            <p className="text-[11px] font-medium uppercase tracking-wide text-brand-dark-grey">
              Current badge
            </p>
            <p className="truncate text-sm font-semibold text-status-purple">{current.name}</p>
          </div>
        </div>

        {next ? (
          <div className="mt-4">
            <p className="text-xs text-brand-dark-grey">
              {pointsToNext} more points to{" "}
              <span className="font-semibold text-brand-black">{next.name}</span>
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-light-grey">
              <div
                className="h-full rounded-full bg-status-purple transition-all"
                style={{ width: `${Math.round(progressToNext * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-brand-dark-grey">You&apos;ve reached the highest badge tier.</p>
        )}
      </div>

      <div className="border-t border-brand-mid-grey/80 bg-gradient-to-b from-brand-light-grey/30 to-white px-5 pb-5 pt-4">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-dark-grey">Badges</p>
        <p className="mt-1 text-[11px] text-brand-dark-grey">Levels unlock as you earn points.</p>
        <div className="mt-4">
          <BadgeDisplay levels={sorted} currentLevelIndex={currentIdx} points={points} />
        </div>
      </div>
    </aside>
  );
}
