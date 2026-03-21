import { useCallback, useEffect, useRef, useState } from "react";
import { Trophy } from "lucide-react";
import type { SubmitResult } from "@/types/quiz.types";
import { getBadgeColor } from "@/utils/badgeUtils";

interface PointsPopupProps {
  result: SubmitResult;
  onClose: () => void;
}

export function PointsPopup({ result, onClose }: PointsPopupProps) {
  const [displayPoints, setDisplayPoints] = useState(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const stableClose = useCallback(() => {
    closeRef.current();
  }, []);

  useEffect(() => {
    const target = result.points_awarded;
    const start = performance.now();
    const duration = 800;
    let frame: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplayPoints(Math.round(target * t));
      if (t < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [result.points_awarded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        stableClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stableClose]);

  const earnedNewBadge = Boolean(result.new_badge);
  const current = result.current_badge;
  const next = result.next_badge;
  const ringPct =
    next && next.min_points > current.min_points
      ? Math.min(
          1,
          Math.max(
            0,
            (result.total_points_now - current.min_points) / (next.min_points - current.min_points),
          ),
        )
      : 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ringPct);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="points-popup-title"
    >
      <div className="points-popup-enter w-full max-w-[400px] rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="trophy-pulse mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F5AA29]/15">
          <Trophy className="h-10 w-10 text-[#F5AA29]" aria-hidden />
        </div>

        <p className="mb-1 text-sm font-medium text-[#464749]">You earned</p>
        <p id="points-popup-title" className="text-[48px] font-bold leading-none text-[#1D4ED8]">
          {displayPoints}
        </p>
        <p className="mb-8 text-sm text-[#464749]">points</p>

        {earnedNewBadge ? (
          <div className="badge-celebrate mb-8 space-y-3">
            <p className="text-sm font-semibold text-[#7632EC]">New Badge Unlocked!</p>
            <div
              className="mx-auto inline-flex items-center gap-2 rounded-full px-6 py-3 text-[28px] font-bold text-white"
              style={{ backgroundColor: getBadgeColor(result.new_badge ?? "") }}
            >
              <span aria-hidden>{current.icon}</span>
              {result.new_badge}
            </div>
          </div>
        ) : (
          <div className="mb-8 flex flex-col items-center">
            {next ? (
              <>
                <div className="relative mx-auto h-[100px] w-[100px]">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#1D4ED8"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-[#0F172A]">{result.total_points_now}</span>
                  </div>
                </div>
                <p className="mt-3 max-w-[280px] text-[13px] text-[#464749]">
                  {result.points_to_next ?? next.points_to_next} more points to{" "}
                  <span className="font-semibold text-[#0F172A]">{next.name}</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-[#464749]">You&apos;ve reached the highest badge tier.</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={stableClose}
          className="h-12 w-full rounded-lg bg-[#1D4ED8] text-base font-bold text-white shadow-lg shadow-[#1D4ED8]/20 transition-colors hover:bg-[#1E40AF]"
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
}
