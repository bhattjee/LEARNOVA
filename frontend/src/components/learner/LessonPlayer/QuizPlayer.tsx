import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as quizService from "@/services/quizService";
import { QuizIntroScreen } from "@/components/learner/quiz/QuizIntroScreen";
import { QuizQuestionPage } from "@/components/learner/quiz/QuizQuestionPage";
import { PointsPopup } from "@/components/learner/quiz/PointsPopup";
import { useQuizStore } from "@/stores/quizStore";
import type { StartAttemptQuestion, SubmitResult } from "@/types/quiz.types";

interface QuizPlayerProps {
  quizId: string;
}

export function QuizPlayer({ quizId }: QuizPlayerProps) {
  const { currentAttemptId, reset } = useQuizStore();
  const [view, setView] = useState<"intro" | "questions" | "result">("intro");
  const [questions, setQuestions] = useState<StartAttemptQuestion[]>([]);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const { data: intro, isLoading: introLoading, refetch: refetchIntro } = useQuery({
    queryKey: ["quiz-intro", quizId],
    queryFn: () => quizService.getQuizIntro(quizId),
    enabled: !!quizId,
  });

  useEffect(() => {
    // If there's no active attempt, show intro
    if (!currentAttemptId) {
      setView("intro");
    }
  }, [currentAttemptId]);

  const handleStart = async () => {
    // The QuizIntroScreen calls startQuizAttempt and updates the store
    // We just need to fetch the questions (or they were already returned by startQuizAttempt)
    // Actually, QuizIntroScreen calls startQuizAttempt and then onStart()
    // Let's refetch the attempt questions
    try {
      const res = await quizService.startQuizAttempt(quizId);
      setQuestions(res.questions);
      setView("questions");
    } catch (err) {
      // toast is handled in QuizIntroScreen
    }
  };

  const handleComplete = (res: SubmitResult) => {
    setResult(res);
    setView("result");
  };

  const handleClosePopup = () => {
    reset();
    setView("intro");
    refetchIntro();
    // Maybe notify parent to go to next lesson?
  };

  if (introLoading || !intro) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Loading quiz details...
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {view === "intro" && (
        <QuizIntroScreen quizIntro={intro} onStart={handleStart} />
      )}
      {view === "questions" && (
        <QuizQuestionPage questions={questions} onComplete={handleComplete} />
      )}
      {view === "result" && result && (
        <PointsPopup result={result} onClose={handleClosePopup} />
      )}
    </div>
  );
}
