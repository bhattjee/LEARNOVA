import { apiClient } from "@/services/apiClient";
import type { ReportingResponse, ReportingStatusFilter } from "@/types/reporting.types";

export async function getReporting(params: {
  status?: ReportingStatusFilter;
  course_id?: string;
  page?: number;
  limit?: number;
}): Promise<ReportingResponse> {
  const res = await apiClient.get<ReportingResponse>("/api/v1/reporting", {
    params: {
      status: params.status ?? "all",
      course_id: params.course_id,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return res.data;
}
