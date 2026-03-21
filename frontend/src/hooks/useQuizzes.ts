import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as quizService from "@/services/quizService";
import type { CreateQuizRequest, SaveQuestionsRequest, UpdateQuizRequest } from "@/types/quiz.types";

export function quizzesQueryKey(courseId: string) {
  return ["quizzes", courseId] as const;
}

export function quizDetailQueryKey(quizId: string) {
  return ["quiz", quizId] as const;
}

export function useQuizzes(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? quizzesQueryKey(courseId) : ["quizzes", "none"],
    queryFn: () => quizService.getQuizzes(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useQuizDetail(quizId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: quizId ? quizDetailQueryKey(quizId) : ["quiz", "none"],
    queryFn: () => quizService.getQuiz(quizId!),
    enabled: Boolean(quizId) && enabled,
  });
}

export function useQuizMutations(courseId: string) {
  const qc = useQueryClient();
  const qk = quizzesQueryKey(courseId);

  const invalidateList = () => {
    void qc.invalidateQueries({ queryKey: qk });
  };

  const create = useMutation({
    mutationFn: (body: CreateQuizRequest) => quizService.createQuiz(courseId, body),
    onSuccess: invalidateList,
  });

  const remove = useMutation({
    mutationFn: (id: string) => quizService.deleteQuiz(id),
    onSuccess: (_, id) => {
      invalidateList();
      qc.removeQueries({ queryKey: quizDetailQueryKey(id) });
    },
  });

  return { create, remove, invalidateList };
}

export function useQuizBuilderMutations(courseId: string, quizId: string) {
  const qc = useQueryClient();
  const qk = quizzesQueryKey(courseId);
  const dk = quizDetailQueryKey(quizId);

  const bump = (detail?: Awaited<ReturnType<typeof quizService.updateQuiz>>) => {
    void qc.invalidateQueries({ queryKey: qk });
    if (detail) {
      qc.setQueryData(dk, detail);
    } else {
      void qc.invalidateQueries({ queryKey: dk });
    }
  };

  const update = useMutation({
    mutationFn: (body: UpdateQuizRequest) => quizService.updateQuiz(quizId, body),
    onSuccess: (data) => bump(data),
  });

  const saveQuestions = useMutation({
    mutationFn: (body: SaveQuestionsRequest) => quizService.saveQuizQuestions(quizId, body),
    onSuccess: (data) => bump(data),
  });

  return { update, saveQuestions };
}
