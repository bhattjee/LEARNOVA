import { Check } from "lucide-react";
import { useQuizStore } from "@/stores/quizStore";
import type { StartAttemptQuestion, SubmitResult } from "@/types/quiz.types";
import { useState } from "react";
import * as quizService from "@/services/quizService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuizQuestionPageProps {
  questions: StartAttemptQuestion[];
  onComplete: (result: SubmitResult) => void;
  variant?: "light" | "dark";
}

export function QuizQuestionPage({ questions, onComplete, variant = "light" }: QuizQuestionPageProps) {
  const { 
    currentQuestionIndex, 
    answers, 
    setAnswer, 
    nextQuestion, 
    currentAttemptId 
  } = useQuizStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  if (!currentQuestion || totalQuestions === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">No questions available.</div>
    );
  }
  
  const selectedOptions = answers[currentQuestion.id] || [];
  
  const handleOptionSelect = (optionId: string) => {
    // Single select radio behavior
    setAnswer(currentQuestion.id, [optionId]);
  };
  
  const handleProceed = async () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      nextQuestion();
    } else {
      // Submit quiz
      if (!currentAttemptId) return;
      
      setIsSubmitting(true);
      try {
        const payload = {
          answers: Object.entries(answers).map(([qId, optIds]) => ({
            question_id: qId,
            selected_option_ids: optIds,
          })),
        };
        const result = await quizService.submitQuiz(currentAttemptId, payload);
        onComplete(result);
      } catch (error) {
        toast.error("Failed to submit quiz. Please check your connection.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isDark = variant === "dark";
  const isLast = currentQuestionIndex === totalQuestions - 1;
  const proceedLabel = isSubmitting
    ? "Submitting…"
    : isLast
      ? "Submit your answer"
      : "Proceed";

  return (
    <div className={cn("flex h-full min-h-0 flex-col", isDark ? "bg-[#0f172a]" : "bg-[#1E293B]")}>
      {/* TOP PROGRESS */}
      <div
        className={cn(
          "border-b border-white/10 p-4 text-white",
          isDark ? "bg-[#121212]" : "bg-[#0F172A]",
        )}
      >
        <div className="mx-auto flex max-w-[800px] flex-col gap-2">
          <div className="flex items-center justify-between text-[12px] font-semibold uppercase tracking-wider opacity-60">
            <span>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span>{Math.round(progressPercent)}% Complete</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full transition-all duration-300", isDark ? "bg-[#9333EA]" : "bg-[#1D4ED8]")}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto p-6">
        <div
          className={cn(
            "mt-4 w-full max-w-[800px] rounded-xl p-8 shadow-2xl",
            isDark ? "border border-zinc-600 bg-[#1a1a2e]" : "mt-8 bg-white",
          )}
        >
          <p
            className={cn(
              "mb-4 text-[13px] font-semibold uppercase tracking-wider",
              isDark ? "text-zinc-400" : "text-[#464749]",
            )}
          >
            Question {currentQuestionIndex + 1}
          </p>
          <h2
            className={cn(
              "mb-8 text-[18px] font-bold leading-[1.6]",
              isDark ? "text-white" : "text-[#0F172A]",
            )}
          >
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOptionSelect(option.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border-2 p-5 text-left transition-all",
                    isSelected
                      ? isDark
                        ? "border-[#9333EA] bg-[#9333EA]/15 shadow-[0_0_0_1px_#9333EA]"
                        : "border-[#1D4ED8] bg-[#EFF6FF] shadow-[0_0_0_1px_#1D4ED8]"
                      : isDark
                        ? "border-zinc-600 bg-[#0f172a] hover:bg-zinc-800/80"
                        : "border border-[#C5CAD3] bg-white hover:bg-[#F3F4F6]",
                  )}
                >
                  <span
                    className={cn(
                      "text-[15px] font-medium",
                      isSelected
                        ? isDark
                          ? "text-[#D8B4FE]"
                          : "text-[#1D4ED8]"
                        : isDark
                          ? "text-zinc-200"
                          : "text-[#0F172A]",
                    )}
                  >
                    {option.text}
                  </span>
                  {isSelected && (
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full",
                        isDark ? "bg-[#9333EA]" : "bg-[#1D4ED8]",
                      )}
                    >
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div
        className={cn(
          "flex justify-center border-t border-white/10 p-6",
          isDark ? "bg-[#121212]" : "bg-[#0F172A]",
        )}
      >
        <div className="flex w-full max-w-[800px] items-center justify-between gap-4">
          <p className="text-[14px] text-white/60">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
          <button
            type="button"
            onClick={handleProceed}
            disabled={selectedOptions.length === 0 || isSubmitting}
            className={cn(
              "h-[48px] rounded-lg px-8 font-bold text-white transition-all disabled:bg-zinc-600",
              isDark
                ? "bg-[#9333EA] hover:bg-[#7C3AED] disabled:opacity-60"
                : "bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#C5CAD3]",
            )}
          >
            {proceedLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
