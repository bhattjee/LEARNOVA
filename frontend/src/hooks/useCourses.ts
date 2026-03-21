import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as courseService from "@/services/courseService";
import * as userService from "@/services/userService";
import type {
  CreateCourseRequest,
  UpdateCourseOptionsRequest,
  UpdateCourseRequest,
} from "@/types/course.types";

const COURSES_KEY = "courses";

function courseKey(id: string) {
  return ["course", id] as const;
}

export function courseAttendeesKey(courseId: string) {
  return ["course-attendees", courseId] as const;
}

export function useGetCourses(search: string, page = 1, limit = 100) {
  const [debounced, setDebounced] = useState(search);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  return useQuery({
    queryKey: [COURSES_KEY, debounced, page, limit],
    queryFn: () =>
      courseService.getCourses({
        search: debounced.trim() || undefined,
        page,
        limit,
      }),
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseRequest) => courseService.createCourse(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [COURSES_KEY] });
    },
  });
}

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? courseKey(courseId) : ["course", "none"],
    queryFn: () => courseService.getCourse(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useUpdateCourse(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateCourseRequest) => courseService.updateCourse(courseId, body),
    onSuccess: (data) => {
      qc.setQueryData(courseKey(courseId), data);
      void qc.invalidateQueries({ queryKey: [COURSES_KEY] });
    },
  });
}

export function useToggleCoursePublish(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => courseService.toggleCoursePublish(courseId),
    onSuccess: (data) => {
      qc.setQueryData(courseKey(courseId), data);
      void qc.invalidateQueries({ queryKey: [COURSES_KEY] });
    },
  });
}

export function useStaffUsers() {
  return useQuery({
    queryKey: ["users", "staff"],
    queryFn: () => userService.getStaffUsers(),
  });
}

export function useCourseAttendees(courseId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: courseId ? courseAttendeesKey(courseId) : ["course-attendees", "none"],
    queryFn: () => courseService.getCourseAttendees(courseId!),
    enabled: Boolean(courseId) && enabled,
  });
}

export function useUpdateCourseOptions(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateCourseOptionsRequest) => courseService.updateCourseOptions(courseId, body),
    onSuccess: (data) => {
      qc.setQueryData(courseKey(courseId), data);
      void qc.invalidateQueries({ queryKey: [COURSES_KEY] });
    },
  });
}

export function useAddCourseAttendees(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emails: string[]) => courseService.addCourseAttendees(courseId, emails),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: courseAttendeesKey(courseId) });
    },
  });
}

export function useContactCourseAttendees(courseId: string) {
  return useMutation({
    mutationFn: (body: { subject: string; body: string }) =>
      courseService.contactCourseAttendees(courseId, body),
  });
}
