export type ReportingRowStatus = "yet_to_start" | "in_progress" | "completed";

export type ReportingStatusFilter = "all" | "not_started" | "in_progress" | "completed";

export interface ReportingOverview {
  total_participants: number;
  yet_to_start: number;
  in_progress: number;
  completed: number;
}

export interface ReportingRow {
  sr_no: number;
  course_name: string;
  participant_name: string;
  participant_email: string;
  enrolled_date: string;
  start_date: string | null;
  time_spent_seconds: number;
  completion_percentage: number;
  completed_date: string | null;
  status: ReportingRowStatus;
}

export interface ReportingResponse {
  overview: ReportingOverview;
  rows: ReportingRow[];
  total: number;
  page: number;
  limit: number;
}
