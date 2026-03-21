import { useQuery } from "@tanstack/react-query";
import * as reportingService from "@/services/reportingService";
import type { ReportingStatusFilter } from "@/types/reporting.types";

export function reportingQueryKey(
  status: ReportingStatusFilter,
  page: number,
  limit: number,
  courseId?: string,
) {
  return ["reporting", status, page, limit, courseId ?? "all"] as const;
}

export function useReporting(
  status: ReportingStatusFilter,
  page: number,
  limit: number,
  courseId?: string,
) {
  return useQuery({
    queryKey: reportingQueryKey(status, page, limit, courseId),
    queryFn: () =>
      reportingService.getReporting({
        status,
        page,
        limit,
        course_id: courseId,
      }),
  });
}
