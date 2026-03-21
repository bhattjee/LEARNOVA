import { BookOpen, RefreshCw } from "lucide-react";
import { useQuizStore } from "@/stores/quizStore";
import * as quizService from "@/services/quizService";
import type { QuizIntroResponse } from "@/types/quiz.types";
import { useState } from "react";
import { toast } from "sonner";

interface QuizIntroScreenProps {
  quizIntro: QuizIntroResponse;
  onStart: () => void;
}

export function QuizIntroScreen({ quizIntro, onStart }: QuizIntroScreenProps) {
  const [isStarting, setIsStarting] = useState(false);
  const setAttempt = useQuizStore((state) => state.setAttempt);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const res = await quizService.startQuizAttempt(quizIntro.quiz_id);
      setAttempt(res.attempt_id);
      onStart();
    } catch (error) {
      toast.error("Failed to start quiz. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="w-full max-w-[480px] bg-white rounded-xl border border-[#C5CAD3] p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-[#EFF6FF] rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-8 h-8 text-[#1D4ED8]" />
        </div>

        <h2 className="text-[20px] font-bold text-[#0F172A] mb-2">
          {quizIntro.title}
        </h2>

        <div className="flex items-center justify-center gap-2 text-[14px] text-[#464749] mb-6">
          <span>{quizIntro.total_questions} Questions</span>
          <span className="w-1 h-1 bg-[#C5CAD3] rounded-full" />
          <div className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            <span>Multiple attempts allowed</span>
          </div>
        </div>

        {quizIntro.user_attempt_count > 0 && (
          <div className="bg-[#F3F4F6] rounded-lg p-4 mb-8 flex flex-col gap-1">
            <p className="text-[14px] font-semibold text-[#0F172A]">
              Your best score: {quizIntro.last_attempt_score ?? 0}%
            </p>
            <p className="text-[12px] text-[#464749]">
              Attempt {quizIntro.user_attempt_count} completed
            </p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={isStarting}
          className="w-full h-[48px] bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#C5CAD3] text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
        >
          {isStarting ? "Starting..." : "Start Quiz"}
        </button>
      </div>
    </div>
  );
}
