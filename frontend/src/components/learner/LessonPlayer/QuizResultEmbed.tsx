import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import type { SubmitResult } from "@/types/quiz.types";
import { getBadgeColor } from "@/utils/badgeUtils";

interface QuizResultEmbedProps {
  result: SubmitResult;
  completedAt: string;
  onContinue: () => void;
}

export function QuizResultEmbed({ result, completedAt, onContinue }: QuizResultEmbedProps) {
  const [displayPoints, setDisplayPoints] = useState(0);

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

  const earnedNewBadge = Boolean(result.new_badge);

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center p-6">
      <div className="w-full max-w-[440px] rounded-2xl border border-zinc-600 bg-[#0f172a] p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
          <Trophy className="h-9 w-9 text-amber-400" aria-hidden />
        </div>
        <h2 className="text-xl font-bold text-white">Bingo! You have earned!</h2>
        <p className="mt-2 text-4xl font-extrabold tabular-nums text-[#93C5FD]">{displayPoints}</p>
        <p className="text-sm text-zinc-400">points</p>

        {earnedNewBadge ? (
          <div
            className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2 text-lg font-bold text-white"
            style={{ backgroundColor: getBadgeColor(result.new_badge ?? "") }}
          >
            <span aria-hidden>{result.current_badge.icon}</span>
            {result.new_badge}
          </div>
        ) : null}

        <p className="mt-4 text-sm text-zinc-400">
          Score {Math.round(result.score_percentage)}% · {result.correct_count}/{result.total_questions} correct
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Finished{" "}
          {new Date(completedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <p className="mt-4 text-xs text-zinc-500">Reach the next rank to gain more points.</p>

        <button
          type="button"
          onClick={onContinue}
          className="mt-8 h-12 w-full rounded-xl bg-[#9333EA] text-base font-bold text-white shadow-lg transition-colors hover:bg-[#7C3AED]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
