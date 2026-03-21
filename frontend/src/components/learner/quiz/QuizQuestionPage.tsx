import { Check } from "lucide-react";
import { useQuizStore } from "@/stores/quizStore";
import type { StartAttemptQuestion, SubmitResult } from "@/types/quiz.types";
import { useState } from "react";
import * as quizService from "@/services/quizService";
import { toast } from "sonner";

interface QuizQuestionPageProps {
  questions: StartAttemptQuestion[];
  onComplete: (result: SubmitResult) => void;
}

export function QuizQuestionPage({ questions, onComplete }: QuizQuestionPageProps) {
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
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  
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

  return (
    <div className="flex flex-col h-full bg-[#1E293B]">
      {/* TOP PROGRESS */}
      <div className="bg-[#0F172A] p-4 text-white border-b border-white/10">
        <div className="max-w-[800px] mx-auto flex flex-col gap-2">
          <div className="flex justify-between items-center text-[12px] font-semibold uppercase tracking-wider opacity-60">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(progressPercent)}% Complete</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#1D4ED8] transition-all duration-300" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
        <div className="w-full max-w-[800px] bg-white rounded-xl p-8 shadow-2xl mt-8">
          <p className="text-[13px] text-[#464749] mb-4 font-semibold uppercase tracking-wider">
            Question {currentQuestionIndex + 1}
          </p>
          <h2 className="text-[18px] text-[#0F172A] font-bold leading-[1.6] mb-8">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-[#EFF6FF] border-2 border-[#1D4ED8] shadow-[0_0_0_1px_#1D4ED8]"
                      : "bg-white border border-[#C5CAD3] hover:bg-[#F3F4F6]"
                  }`}
                >
                  <span className={`text-[15px] font-medium ${isSelected ? "text-[#1D4ED8]" : "text-[#0F172A]"}`}>
                    {option.text}
                  </span>
                  {isSelected && (
                    <div className="w-6 h-6 bg-[#1D4ED8] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="bg-[#0F172A] p-6 border-t border-white/10 flex justify-center items-center">
        <div className="w-full max-w-[800px] flex justify-between items-center">
          <p className="text-white/60 text-[14px]">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
          <button
            onClick={handleProceed}
            disabled={selectedOptions.length === 0 || isSubmitting}
            className="h-[48px] px-8 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#C5CAD3] text-white font-bold rounded-lg transition-all"
          >
            {isSubmitting ? "Submitting..." : (currentQuestionIndex === totalQuestions - 1 ? "Proceed and Complete Quiz" : "Proceed")}
          </button>
        </div>
      </div>
    </div>
  );
}
