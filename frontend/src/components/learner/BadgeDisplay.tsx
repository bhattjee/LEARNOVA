import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearnerBadgeLevel } from "@/constants/learnerBadges";

interface BadgeDisplayProps {
  levels: LearnerBadgeLevel[];
  currentLevelIndex: number;
  points: number;
}

export function BadgeDisplay({ levels, currentLevelIndex, points }: BadgeDisplayProps) {
  return (
    <ul className="flex flex-col gap-2" aria-label="Badge levels">
      {levels.map((level, index) => {
        const achieved = points >= level.thresholdPoints;
        const isCurrent = index === currentLevelIndex;
        return (
          <li
            key={level.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm",
              isCurrent
                ? "border-status-purple bg-[#F5F0FF] text-status-purple"
                : "border-transparent text-brand-dark-grey",
            )}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
              {achieved && !isCurrent ? (
                <Check className="h-4 w-4 text-status-success" strokeWidth={2.5} />
              ) : (
                <Star
                  className={cn("h-4 w-4", isCurrent ? "text-status-purple" : "text-brand-mid-grey")}
                  fill={isCurrent ? "currentColor" : "none"}
                />
              )}
            </span>
            <span className={cn("min-w-0 flex-1 font-medium", isCurrent && "text-status-purple")}>
              {level.name}
            </span>
            <span className="shrink-0 text-xs text-brand-dark-grey">{level.thresholdPoints} pts</span>
          </li>
        );
      })}
    </ul>
  );
}
