import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as quizService from "@/services/quizService";
import { QuizIntroScreen } from "@/components/learner/quiz/QuizIntroScreen";
import { QuizQuestionPage } from "@/components/learner/quiz/QuizQuestionPage";
import { QuizResultEmbed } from "@/components/learner/LessonPlayer/QuizResultEmbed";
import { useQuizStore } from "@/stores/quizStore";
import type { StartAttemptQuestion, SubmitResult } from "@/types/quiz.types";

interface QuizPlayerProps {
  quizId: string;
  /** Called when the learner finishes the quiz (server result). */
  onQuizComplete?: (result: SubmitResult, completedAtIso: string) => void;
}

export function QuizPlayer({ quizId, onQuizComplete }: QuizPlayerProps) {
  const { reset } = useQuizStore();
  const [view, setView] = useState<"intro" | "questions" | "result">("intro");
  const [questions, setQuestions] = useState<StartAttemptQuestion[]>([]);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  const { data: intro, isLoading: introLoading, refetch: refetchIntro } = useQuery({
    queryKey: ["quiz-intro", quizId],
    queryFn: () => quizService.getQuizIntro(quizId),
    enabled: !!quizId,
  });

  useEffect(() => {
    reset();
    setView("intro");
    setQuestions([]);
    setResult(null);
    setCompletedAt(null);
  }, [quizId, reset]);

  const handleQuizStarted = (q: StartAttemptQuestion[]) => {
    setQuestions(q);
    setView("questions");
  };

  const handleComplete = (res: SubmitResult) => {
    const at = new Date().toISOString();
    setResult(res);
    setCompletedAt(at);
    setView("result");
    onQuizComplete?.(res, at);
  };

  const handleContinueFromResult = () => {
    reset();
    setView("intro");
    void refetchIntro();
  };

  if (introLoading || !intro) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-400">Loading quiz details…</div>
    );
  }

  return (
    <div className="h-full w-full min-h-0">
      {view === "intro" && (
        <QuizIntroScreen quizIntro={intro} onStart={handleQuizStarted} variant="dark" />
      )}
      {view === "questions" && (
        <QuizQuestionPage questions={questions} onComplete={handleComplete} variant="dark" />
      )}
      {view === "result" && result && completedAt && (
        <QuizResultEmbed result={result} completedAt={completedAt} onContinue={handleContinueFromResult} />
      )}
    </div>
  );
}
