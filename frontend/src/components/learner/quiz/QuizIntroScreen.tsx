import { BookOpen, RefreshCw } from "lucide-react";
import { useQuizStore } from "@/stores/quizStore";
import * as quizService from "@/services/quizService";
import type { QuizIntroResponse, StartAttemptQuestion } from "@/types/quiz.types";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuizIntroScreenProps {
  quizIntro: QuizIntroResponse;
  onStart: (questions: StartAttemptQuestion[]) => void;
  /** Dark styling when embedded in the lesson player. */
  variant?: "light" | "dark";
}

export function QuizIntroScreen({ quizIntro, onStart, variant = "light" }: QuizIntroScreenProps) {
  const [isStarting, setIsStarting] = useState(false);
  const setAttempt = useQuizStore((state) => state.setAttempt);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const res = await quizService.startQuizAttempt(quizIntro.quiz_id);
      setAttempt(res.attempt_id);
      onStart(res.questions);
    } catch (error) {
      toast.error("Failed to start quiz. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const isDark = variant === "dark";

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
      <div
        className={cn(
          "w-full max-w-[480px] rounded-xl border p-8 text-center shadow-sm",
          isDark ? "border-zinc-600 bg-[#0f172a]" : "border-[#C5CAD3] bg-white",
        )}
      >
        <div
          className={cn(
            "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full",
            isDark ? "bg-[#1D4ED8]/20" : "bg-[#EFF6FF]",
          )}
        >
          <BookOpen className={cn("h-8 w-8", isDark ? "text-[#93C5FD]" : "text-[#1D4ED8]")} />
        </div>

        <h2 className={cn("mb-2 text-[20px] font-bold", isDark ? "text-white" : "text-[#0F172A]")}>
          {quizIntro.title}
        </h2>

        <div
          className={cn(
            "mb-6 flex items-center justify-center gap-2 text-[14px]",
            isDark ? "text-zinc-400" : "text-[#464749]",
          )}
        >
          <span>— Total Questions {quizIntro.total_questions}</span>
          <span className={cn("h-1 w-1 rounded-full", isDark ? "bg-zinc-600" : "bg-[#C5CAD3]")} />
          <div className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            <span>{quizIntro.allows_multiple_attempts ? "Multiple attempts" : "Single attempt"}</span>
          </div>
        </div>

        {quizIntro.user_attempt_count > 0 && (
          <div
            className={cn(
              "mb-8 flex flex-col gap-1 rounded-lg p-4",
              isDark ? "bg-zinc-800/80" : "bg-[#F3F4F6]",
            )}
          >
            <p className={cn("text-[14px] font-semibold", isDark ? "text-zinc-100" : "text-[#0F172A]")}>
              Your best score: {quizIntro.last_attempt_score ?? 0}%
            </p>
            <p className={cn("text-[12px]", isDark ? "text-zinc-400" : "text-[#464749]")}>
              Attempt {quizIntro.user_attempt_count} completed
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={isStarting}
          className={cn(
            "flex h-[48px] w-full items-center justify-center rounded-lg font-semibold text-white transition-colors",
            isDark
              ? "bg-[#9333EA] hover:bg-[#7C3AED] disabled:bg-zinc-600"
              : "bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#C5CAD3]",
          )}
        >
          {isStarting ? "Starting..." : "Start Quiz"}
        </button>
      </div>
    </div>
  );
}
