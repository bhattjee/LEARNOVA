import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { BadgeDisplay } from "@/components/learner/BadgeDisplay";
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
}

export function ProfilePanel({ user, isLoading }: ProfilePanelProps) {
  const points = user?.total_points ?? 0;
  const { sorted, current, next, currentIdx, progressToNext, pointsToNext } = learnerBadgeState(points);

  if (isLoading || !user) {
    return (
      <aside className="w-full rounded-xl border border-brand-mid-grey bg-white p-5 lg:w-[280px] lg:shrink-0">
        <Skeleton className="h-6 w-24" />
        <div className="mt-4 flex flex-col items-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="mt-3 h-6 w-3/4" />
          <Skeleton className="mt-1 h-4 w-1/2" />
        </div>
        <hr className="my-5 border-brand-mid-grey" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-1 h-8 w-16" />
        <Skeleton className="mt-4 h-12 w-full rounded-lg" />
        <div className="mt-5 space-y-2">
          <Skeleton className="h-3 w-16" />
          <div className="flex gap-2">
             {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-10 rounded-lg" />)}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full rounded-xl border border-brand-mid-grey bg-white p-5 lg:w-[280px] lg:shrink-0">
      <h2 className="text-base font-bold text-brand-black">My Profile</h2>

      <div className="mt-4 flex flex-col items-center text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary"
          aria-hidden
        >
          {initials(user.full_name)}
        </div>
        <p className="mt-3 text-lg font-bold text-brand-black">{user.full_name}</p>
        <p className="mt-0.5 text-[13px] text-brand-dark-grey">{user.email}</p>
      </div>

      <hr className="my-5 border-brand-mid-grey" />

      <div>
        <p className="text-sm text-brand-dark-grey">Total Points</p>
        <p className="mt-0.5 text-2xl font-bold text-primary">{points}</p>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F5F0FF] px-3 py-2">
        <Trophy className="h-5 w-5 shrink-0 text-status-purple" aria-hidden />
        <div className="min-w-0 text-left">
          <p className="text-xs text-brand-dark-grey">Current badge</p>
          <p className="truncate text-sm font-semibold text-status-purple">{current.name}</p>
        </div>
      </div>

      {next ? (
        <div className="mt-4">
          <p className="text-xs text-brand-dark-grey">
            {pointsToNext} more points to <span className="font-medium text-brand-black">{next.name}</span>
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

      <div className="mt-5">
        <p className="mb-2 text-xs font-medium text-brand-dark-grey">All levels</p>
        <BadgeDisplay levels={sorted} currentLevelIndex={currentIdx} points={points} />
      </div>
    </aside>
  );
}
