import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Columns2, Loader2, Users, X } from "lucide-react";
import { formatDurationShort } from "@/lib/formatDuration";
import { cn } from "@/lib/utils";
import { useReporting } from "@/hooks/useReporting";
import type { ReportingRowStatus, ReportingStatusFilter } from "@/types/reporting.types";

const LS_COLUMNS = "learnova-reporting-columns-v1";

const TOGGLEABLE = [
  { key: "course_name", label: "Course Name" },
  { key: "enrolled_date", label: "Enrolled Date" },
  { key: "start_date", label: "Start Date" },
  { key: "time_spent", label: "Time Spent" },
  { key: "completion_pct", label: "Completion %" },
  { key: "completed_date", label: "Completed Date" },
  { key: "status", label: "Status" },
] as const;

type ToggleableKey = (typeof TOGGLEABLE)[number]["key"];

type ColumnVisibility = Record<ToggleableKey, boolean>;

const DEFAULT_VISIBILITY: ColumnVisibility = {
  course_name: true,
  enrolled_date: true,
  start_date: true,
  time_spent: true,
  completion_pct: true,
  completed_date: true,
  status: true,
};

function loadColumnVisibility(): ColumnVisibility {
  try {
    const raw = localStorage.getItem(LS_COLUMNS);
    if (!raw) return { ...DEFAULT_VISIBILITY };
    const parsed = JSON.parse(raw) as Partial<ColumnVisibility>;
    return { ...DEFAULT_VISIBILITY, ...parsed };
  } catch {
    return { ...DEFAULT_VISIBILITY };
  }
}

function saveColumnVisibility(v: ColumnVisibility) {
  localStorage.setItem(LS_COLUMNS, JSON.stringify(v));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function StatusBadge({ status }: { status: ReportingRowStatus }) {
  const cfg = {
    yet_to_start: { label: "Yet to start", className: "bg-slate-100 text-slate-700" },
    in_progress: { label: "In progress", className: "bg-amber-100 text-amber-900" },
    completed: { label: "Completed", className: "bg-emerald-100 text-emerald-900" },
  }[status];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

const PAGE_SIZE = 20;

export function ReportingPage() {
  const [statusFilter, setStatusFilter] = useState<ReportingStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [cols, setCols] = useState<ColumnVisibility>(() =>
    typeof window !== "undefined" ? loadColumnVisibility() : DEFAULT_VISIBILITY,
  );

  const { data, isLoading, isError } = useReporting(statusFilter, page, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.limit));
  }, [data]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function setCol(key: ToggleableKey, visible: boolean) {
    setCols((prev) => {
      const next = { ...prev, [key]: visible };
      saveColumnVisibility(next);
      return next;
    });
  }

  function resetColumns() {
    setCols({ ...DEFAULT_VISIBILITY });
    saveColumnVisibility({ ...DEFAULT_VISIBILITY });
  }

  const filterLabel =
    statusFilter === "all"
      ? null
      : statusFilter === "not_started"
        ? "Yet to Start"
        : statusFilter === "in_progress"
          ? "In Progress"
          : "Completed";

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-brand-dark-grey">
        <Loader2 className="h-10 w-10 animate-spin" aria-hidden />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-status-danger" role="alert">
        Could not load reporting data.
      </p>
    );
  }

  const { overview, rows, total } = data;
  const noParticipants = overview.total_participants === 0;

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={cn(
            "rounded-lg border bg-white p-5 text-left shadow-sm transition-all",
            "border-l-4 border-l-primary",
            statusFilter === "all" ? "border-2 border-primary bg-primary/10 ring-2 ring-primary/20" : "border-brand-mid-grey",
          )}
        >
          <p className="text-[28px] font-bold leading-tight text-[#0F172A]">{overview.total_participants}</p>
          <p className="mt-1 text-[13px] text-[#464749]">Total Participants</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("not_started")}
          className={cn(
            "rounded-lg border bg-white p-5 text-left shadow-sm transition-all",
            "border-l-4 border-l-slate-400",
            statusFilter === "not_started"
              ? "border-2 border-slate-400 bg-slate-100/80 ring-2 ring-slate-300"
              : "border-brand-mid-grey",
          )}
        >
          <p className="text-[28px] font-bold leading-tight text-[#0F172A]">{overview.yet_to_start}</p>
          <p className="mt-1 text-[13px] text-[#464749]">Yet to Start</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("in_progress")}
          className={cn(
            "rounded-lg border bg-white p-5 text-left shadow-sm transition-all",
            "border-l-4 border-l-[#F5AA29]",
            statusFilter === "in_progress"
              ? "border-2 border-[#F5AA29] bg-[#F5AA29]/15 ring-2 ring-[#F5AA29]/30"
              : "border-brand-mid-grey",
          )}
        >
          <p className="text-[28px] font-bold leading-tight text-[#0F172A]">{overview.in_progress}</p>
          <p className="mt-1 text-[13px] text-[#464749]">In Progress</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={cn(
            "rounded-lg border bg-white p-5 text-left shadow-sm transition-all",
            "border-l-4 border-l-[#058E61]",
            statusFilter === "completed"
              ? "border-2 border-[#058E61] bg-[#058E61]/10 ring-2 ring-[#058E61]/25"
              : "border-brand-mid-grey",
          )}
        >
          <p className="text-[28px] font-bold leading-tight text-[#0F172A]">{overview.completed}</p>
          <p className="mt-1 text-[13px] text-[#464749]">Completed</p>
        </button>
      </div>

      {!noParticipants ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {filterLabel ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-light-grey px-3 py-1 text-sm text-brand-black">
                  {filterLabel}
                  <button
                    type="button"
                    className="rounded p-0.5 hover:bg-brand-mid-grey/40"
                    aria-label="Clear filter"
                    onClick={() => setStatusFilter("all")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <span className="text-sm text-brand-dark-grey">All Learners</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-brand-mid-grey bg-white px-3 text-sm font-medium text-brand-dark-grey hover:bg-brand-light-grey"
            >
              <Columns2 className="h-4 w-4" />
              Columns
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-brand-mid-grey bg-white py-16 text-center text-sm text-brand-dark-grey">
              No learners match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-brand-mid-grey bg-white shadow-sm">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[#F3F4F6]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-brand-dark-grey">
                    <th className="whitespace-nowrap px-4 py-3">Sr No</th>
                    {cols.course_name ? <th className="whitespace-nowrap px-4 py-3">Course Name</th> : null}
                    <th className="whitespace-nowrap px-4 py-3">Participant Name</th>
                    {cols.enrolled_date ? <th className="whitespace-nowrap px-4 py-3">Enrolled Date</th> : null}
                    {cols.start_date ? <th className="whitespace-nowrap px-4 py-3">Start Date</th> : null}
                    {cols.time_spent ? <th className="whitespace-nowrap px-4 py-3">Time Spent</th> : null}
                    {cols.completion_pct ? <th className="whitespace-nowrap px-4 py-3">Completion %</th> : null}
                    {cols.completed_date ? <th className="whitespace-nowrap px-4 py-3">Completed Date</th> : null}
                    {cols.status ? <th className="whitespace-nowrap px-4 py-3">Status</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-mid-grey">
                  {rows.map((row) => (
                    <tr key={`${row.sr_no}-${row.participant_email}-${row.course_name}`} className="text-brand-black">
                      <td className="whitespace-nowrap px-4 py-3 text-brand-dark-grey">{row.sr_no}</td>
                      {cols.course_name ? (
                        <td className="max-w-[200px] truncate px-4 py-3" title={row.course_name}>
                          {row.course_name}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{row.participant_name}</td>
                      {cols.enrolled_date ? (
                        <td className="whitespace-nowrap px-4 py-3 text-brand-dark-grey">
                          {formatDate(row.enrolled_date)}
                        </td>
                      ) : null}
                      {cols.start_date ? (
                        <td className="whitespace-nowrap px-4 py-3 text-brand-dark-grey">
                          {formatDate(row.start_date)}
                        </td>
                      ) : null}
                      {cols.time_spent ? (
                        <td className="whitespace-nowrap px-4 py-3 text-brand-dark-grey">
                          {formatDurationShort(row.time_spent_seconds)}
                        </td>
                      ) : null}
                      {cols.completion_pct ? (
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-brand-mid-grey">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.min(100, row.completion_percentage)}%` }}
                              />
                            </div>
                            <span className="tabular-nums text-brand-dark-grey">{row.completion_percentage}%</span>
                          </div>
                        </td>
                      ) : null}
                      {cols.completed_date ? (
                        <td className="whitespace-nowrap px-4 py-3 text-brand-dark-grey">
                          {formatDate(row.completed_date)}
                        </td>
                      ) : null}
                      {cols.status ? (
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-brand-dark-grey">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-md border border-brand-mid-grey bg-white px-3 py-1.5 font-medium hover:bg-brand-light-grey disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-md border border-brand-mid-grey bg-white px-3 py-1.5 font-medium hover:bg-brand-light-grey disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="text-xs">({total} total)</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-mid-grey bg-white px-6 py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-light-grey text-brand-dark-grey">
            <Users className="h-10 w-10 opacity-70" strokeWidth={1.25} />
          </div>
          <p className="max-w-md text-sm text-brand-dark-grey">
            No learner data yet. Learners will appear here once they enroll in a course.
          </p>
        </div>
      )}

      {panelOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/40"
            aria-label="Close"
            onClick={() => setPanelOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[280px] flex-col border-l border-brand-mid-grey bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-mid-grey px-4 py-3">
              <h2 className="text-base font-semibold text-brand-black">Customize Columns</h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded p-1 text-brand-dark-grey hover:bg-brand-light-grey"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-3">
                {TOGGLEABLE.map((c) => (
                  <li key={c.key}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-black">
                      <input
                        type="checkbox"
                        checked={cols[c.key]}
                        onChange={(e) => setCol(c.key, e.target.checked)}
                        className="h-4 w-4 rounded border-brand-mid-grey text-primary focus:ring-primary"
                      />
                      {c.label}
                    </label>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={resetColumns}
                className="mt-6 text-sm font-medium text-primary hover:underline"
              >
                Reset to default
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
