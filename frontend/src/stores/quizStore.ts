import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QuizState {
  currentAttemptId: string | null;
  currentQuestionIndex: number;
  answers: Record<string, string[]>; // questionId -> selectedOptionIds
  isComplete: boolean;

  setAttempt: (attemptId: string) => void;
  setAnswer: (questionId: string, optionIds: string[]) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  reset: () => void;
  setComplete: (complete: boolean) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      currentAttemptId: null,
      currentQuestionIndex: 0,
      answers: {},
      isComplete: false,

      setAttempt: (attemptId) =>
        set({
          currentAttemptId: attemptId,
          currentQuestionIndex: 0,
          answers: {},
          isComplete: false,
        }),

      setAnswer: (questionId, optionIds) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: optionIds,
          },
        })),

      nextQuestion: () =>
        set((state) => ({
          currentQuestionIndex: state.currentQuestionIndex + 1,
        })),

      prevQuestion: () =>
        set((state) => ({
          currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
        })),

      setComplete: (complete) => set({ isComplete: complete }),

      reset: () =>
        set({
          currentAttemptId: null,
          currentQuestionIndex: 0,
          answers: {},
          isComplete: false,
        }),
    }),
    {
      name: "learnova-quiz-store",
    }
  )
);
