import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as learnerCatalogService from "@/services/learnerCatalogService";
import { useAuthStore } from "@/stores/authStore";

const PUBLIC_KEY = "public-courses";
export const MY_COURSES_KEY = "my-courses";
export const LEARNER_DETAIL_KEY = "course-learner-detail";

export function usePublicCourses(search: string) {
  const token = useAuthStore((s) => s.token);
  const [debounced, setDebounced] = useState(search);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  return useQuery({
    queryKey: [PUBLIC_KEY, debounced, token ?? "anon"],
    queryFn: () =>
      learnerCatalogService.getPublicCourses({
        search: debounced.trim() || undefined,
      }),
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: [MY_COURSES_KEY],
    queryFn: () => learnerCatalogService.getMyCourses(),
  });
}

export function useLearnerCourseDetail(courseId: string | undefined) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: [LEARNER_DETAIL_KEY, courseId, token ?? "anon"],
    queryFn: () => learnerCatalogService.getCourseLearnerDetail(courseId!),
    enabled: Boolean(courseId),
  });
}
