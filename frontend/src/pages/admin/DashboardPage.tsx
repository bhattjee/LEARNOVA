import { useMemo, useState } from "react";
import {
  Clock,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  SquarePen,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { DashboardCourseCard } from "@/components/admin/courses/DashboardCourseCard";
import { CreateCourseModal } from "@/components/admin/courses/CreateCourseModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_ADMIN_COURSE_SAMPLES } from "@/constants/mockShowcaseCourses";
import { useGetCourses } from "@/hooks/useCourses";
import { formatDuration } from "@/lib/formatDuration";
import { resolvePublicFileUrl } from "@/lib/assetUrl";
import type { CourseListItem, KanbanColumn } from "@/types/course.types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

function splitKanban(courses: CourseListItem[]): { draft: KanbanColumn; published: KanbanColumn } {
  const draftCourses = courses.filter((c) => !c.is_published);
  const publishedCourses = courses.filter((c) => c.is_published);
  return {
    draft: { id: "draft", label: "Draft", courses: draftCourses },
    published: { id: "published", label: "Published", courses: publishedCourses },
  };
}

function RowActions({ course }: { course: CourseListItem }) {
  const navigate = useNavigate();

  function share() {
    const url = `${window.location.origin}/courses/${course.id}`;
    void navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied!");
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-brand-dark-grey hover:bg-brand-light-grey"
          aria-label="Actions"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>
          <SquarePen className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={share}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "list" ? "list" : "kanban";
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError } = useGetCourses(search);

  const columns = useMemo(() => {
    const list = data?.data ?? [];
    return splitKanban(list);
  }, [data?.data]);

  function setView(next: "kanban" | "list") {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", next);
    setSearchParams(nextParams, { replace: true });
  }

  const kanbanSections = [columns.draft, columns.published];

  return (
    <>
      <div className="relative pb-24">
        {/* Toolbar: wireframe — search + view toggles; list matches “E-learning Kanban” */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:max-w-3xl">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-dark-grey"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-brand-mid-grey bg-white py-2 pl-10 pr-3 text-sm text-brand-black shadow-sm outline-none ring-primary-light focus:border-primary focus:ring-2"
              />
            </div>
            <div className="inline-flex shrink-0 rounded-xl border border-brand-mid-grey bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
                  view === "kanban"
                    ? "bg-primary text-white shadow-sm"
                    : "text-brand-dark-grey hover:bg-brand-light-grey",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
                  view === "list"
                    ? "bg-primary text-white shadow-sm"
                    : "text-brand-dark-grey hover:bg-brand-light-grey",
                )}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>
          </div>
        </div>

        {isError ? (
          <p className="text-sm text-status-danger" role="alert">
            Could not load courses. Check your connection and try again.
          </p>
        ) : null}

        {isLoading ? (
          view === "kanban" ? (
            <div className="mx-auto max-w-5xl space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-brand-mid-grey bg-white p-6 shadow-sm">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-4 h-4 w-1/3" />
                  <div className="mt-6 flex gap-8">
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-10 w-16" />
                    <Skeleton className="h-10 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-brand-mid-grey bg-white">
              <div className="space-y-4 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          )
        ) : view === "kanban" ? (
          <div className="mx-auto w-full max-w-5xl space-y-8 sm:space-y-10">
            {kanbanSections.map((col) => (
              <section key={col.id} className="space-y-4">
                <div className="flex items-center justify-between border-b border-brand-mid-grey pb-2">
                  <h3 className="text-base font-bold text-brand-black">{col.label}</h3>
                  <span className="rounded-full bg-brand-light-grey px-2.5 py-0.5 text-xs font-semibold text-brand-dark-grey">
                    {col.courses.length}
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {col.courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-mid-grey bg-white py-14 text-center">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                        <Plus className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-brand-black">No {col.label.toLowerCase()} courses</p>
                      {col.id === "draft" && search === "" && (
                        <button
                          type="button"
                          onClick={() => setModalOpen(true)}
                          className="mt-2 text-xs font-semibold text-primary hover:underline"
                        >
                          Create your first course
                        </button>
                      )}
                    </div>
                  ) : (
                    col.courses.map((c) => <DashboardCourseCard key={c.id} course={c} />)
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (data?.data ?? []).length === 0 ? (
          <div className="rounded-xl border border-brand-mid-grey bg-white py-14 text-center sm:py-16">
            <div className="flex flex-col items-center px-4">
              <p className="text-sm font-medium text-brand-black">No courses found</p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                Add your first course to get started
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {(data?.data ?? []).map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-brand-mid-grey bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/admin/courses/${course.id}/edit`}
                      className="min-w-0 flex-1 text-sm font-semibold leading-snug text-brand-black hover:text-primary"
                    >
                      {course.title}
                    </Link>
                    <RowActions course={course} />
                  </div>
                  {course.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {course.tags.slice(0, 6).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-brand-light-grey px-2 py-0.5 text-xs text-brand-dark-grey"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-brand-mid-grey/80 pt-3 text-xs">
                    <div>
                      <dt className="text-brand-dark-grey">Views</dt>
                      <dd className="font-semibold tabular-nums text-brand-black">{course.views_count}</dd>
                    </div>
                    <div>
                      <dt className="text-brand-dark-grey">Lessons</dt>
                      <dd className="font-semibold tabular-nums text-brand-black">{course.total_lessons_count}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-brand-dark-grey">Duration</dt>
                      <dd className="inline-flex items-center gap-1 font-semibold tabular-nums text-brand-black">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {formatDuration(course.total_duration_seconds)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="sr-only">Status</dt>
                      <dd>
                        {course.is_published ? (
                          <span className="inline-flex rounded-full bg-status-success px-2 py-0.5 text-xs font-medium text-white">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-brand-mid-grey px-2 py-0.5 text-xs font-medium text-brand-dark-grey">
                            Draft
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-xl border border-brand-mid-grey bg-white md:block">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-mid-grey bg-brand-light-grey">
                    <th className="px-4 py-3 font-semibold text-brand-dark-grey">Course</th>
                    <th className="px-4 py-3 font-semibold text-brand-dark-grey">Tags</th>
                    <th className="px-4 py-3 font-semibold text-brand-dark-grey">Views</th>
                    <th className="px-4 py-3 font-semibold text-brand-dark-grey">Lessons</th>
                    <th className="px-4 py-3 font-semibold text-brand-dark-grey">Duration</th>
                    <th className="px-4 py-3 font-semibold text-brand-dark-grey">Status</th>
                    <th className="px-4 py-3 font-semibold text-brand-dark-grey">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data ?? []).map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-brand-mid-grey transition-colors hover:bg-brand-light-grey"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/courses/${course.id}/edit`}
                          className="font-semibold text-brand-black hover:text-primary"
                        >
                          {course.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {course.tags.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-brand-light-grey px-2 py-0.5 text-xs text-brand-dark-grey"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-brand-dark-grey">{course.views_count}</td>
                      <td className="px-4 py-3 text-brand-dark-grey">{course.total_lessons_count}</td>
                      <td className="px-4 py-3 text-brand-dark-grey">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(course.total_duration_seconds)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {course.is_published ? (
                          <span className="rounded-full bg-status-success px-2 py-0.5 text-xs font-medium text-white">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-brand-mid-grey px-2 py-0.5 text-xs font-medium text-brand-dark-grey">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <RowActions course={course} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!isLoading && !isError && (data?.data ?? []).length === 0 && search.trim() === "" ? (
          <section
            className="mt-10 rounded-xl border border-dashed border-primary/35 bg-primary-light/50 p-6"
            aria-label="Sample courses preview"
          >
            <p className="text-sm font-semibold text-primary">Sample course titles (learner dashboard preview)</p>
            <p className="mt-1 text-xs text-brand-dark-grey">
              Static examples matching the My Courses mock — create a course to replace these with live data.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {MOCK_ADMIN_COURSE_SAMPLES.map((c) => {
                const cover = resolvePublicFileUrl(c.cover_image_url);
                return (
                  <div
                    key={c.id}
                    className="overflow-hidden rounded-xl border border-brand-mid-grey bg-white shadow-sm"
                  >
                    <div
                      className="h-28 w-full bg-cover bg-center"
                      style={cover ? { backgroundImage: `url(${cover})` } : undefined}
                    />
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-bold text-brand-black">{c.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-brand-dark-grey">
                        <span>{c.total_lessons_count} lessons</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          {formatDuration(c.total_duration_seconds)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "mt-2 inline-block px-2 py-0.5 text-[10px] font-semibold uppercase",
                          c.is_published
                            ? "bg-status-success/15 text-status-success"
                            : "bg-brand-mid-grey/80 text-brand-dark-grey",
                        )}
                      >
                        {c.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {/* FAB: wireframe — create course wizard */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#7632EC] text-white shadow-lg transition-transform hover:scale-[1.03] hover:bg-[#6528d4] focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-light lg:bottom-8 lg:left-[calc(240px+1.5rem)] lg:right-auto"
        aria-label="Create new course"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <CreateCourseModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
