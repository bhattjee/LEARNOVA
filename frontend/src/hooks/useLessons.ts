import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as lessonService from "@/services/lessonService";
import type { CreateAttachmentRequest, CreateLessonRequest, UpdateLessonRequest } from "@/types/lesson.types";

export function lessonsQueryKey(courseId: string) {
  return ["lessons", courseId] as const;
}

export function useLessons(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? lessonsQueryKey(courseId) : ["lessons", "none"],
    queryFn: () => lessonService.getLessons(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useLesson(lessonId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["lesson", lessonId ?? "none"],
    queryFn: () => lessonService.getLesson(lessonId!),
    enabled: Boolean(lessonId) && enabled,
  });
}

function lessonDetailQueryKey(lessonId: string) {
  return ["lesson", lessonId] as const;
}

export function useLessonMutations(courseId: string) {
  const qc = useQueryClient();
  const lk = lessonsQueryKey(courseId);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: lk });
    if (courseId) {
      void qc.invalidateQueries({ queryKey: ["course", courseId] });
    }
  };

  const create = useMutation({
    mutationFn: (body: CreateLessonRequest) => lessonService.createLesson(courseId, body),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateLessonRequest }) =>
      lessonService.updateLesson(id, body),
    onSuccess: (updated, { id }) => {
      invalidate();
      qc.setQueryData(lessonDetailQueryKey(id), updated);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => lessonService.deleteLesson(id),
    onSuccess: (_, id) => {
      invalidate();
      qc.removeQueries({ queryKey: lessonDetailQueryKey(id) });
    },
  });

  const reorder = useMutation({
    mutationFn: (lessonIds: string[]) => lessonService.reorderLessons(courseId, lessonIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: lk });
    },
  });

  const addAtt = useMutation({
    mutationFn: ({ lessonId, body }: { lessonId: string; body: CreateAttachmentRequest }) =>
      lessonService.addAttachment(lessonId, body),
    onSuccess: (_, { lessonId }) => {
      invalidate();
      void qc.invalidateQueries({ queryKey: lessonDetailQueryKey(lessonId) });
    },
  });

  const removeAtt = useMutation({
    mutationFn: ({ lessonId, attachmentId }: { lessonId: string; attachmentId: string }) =>
      lessonService.deleteAttachment(lessonId, attachmentId),
    onSuccess: (_, { lessonId }) => {
      invalidate();
      void qc.invalidateQueries({ queryKey: lessonDetailQueryKey(lessonId) });
    },
  });

  return { create, update, remove, reorder, addAtt, removeAtt, invalidate };
}
