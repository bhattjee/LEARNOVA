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
import { CourseCard } from "@/components/admin/courses/CourseCard";
import { CreateCourseModal } from "@/components/admin/courses/CreateCourseModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetCourses } from "@/hooks/useCourses";
import { formatDuration } from "@/lib/formatDuration";
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-2xl font-semibold text-brand-black">Courses</h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="inline-flex rounded-md border border-brand-mid-grey bg-white p-0.5">
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium",
                  view === "kanban"
                    ? "bg-primary-light text-primary"
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
                  "inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium",
                  view === "list"
                    ? "bg-primary-light text-primary"
                    : "text-brand-dark-grey hover:bg-brand-light-grey",
                )}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>

            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-dark-grey"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-md border border-brand-mid-grey bg-white py-2 pl-9 pr-3 text-sm text-brand-black outline-none ring-primary-light focus:border-primary focus:ring-2"
              />
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" />
              New Course
            </button>
          </div>
        </div>

        {isError ? (
          <p className="text-sm text-status-danger" role="alert">
            Could not load courses. Check your connection and try again.
          </p>
        ) : null}

        {isLoading ? (
          view === "kanban" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {[1, 2].map((id) => (
                <div key={id} className="rounded-xl border border-brand-mid-grey bg-white p-4">
                  <Skeleton className="h-6 w-24 mb-4" />
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg border border-brand-mid-grey p-4">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="mt-2 h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-brand-mid-grey bg-white">
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          )
        ) : view === "kanban" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {[columns.draft, columns.published].map((col) => (
              <section key={col.id} className="rounded-xl border border-brand-mid-grey bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-brand-black">{col.label}</h3>
                  <span className="rounded-full bg-brand-light-grey px-2 py-0.5 text-xs font-medium text-brand-dark-grey">
                    {col.courses.length}
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {col.courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-mid-grey/10 text-brand-dark-grey/40">
                        <Plus className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-brand-black">No {col.label.toLowerCase()} courses</p>
                      {col.id === "draft" && search === "" && (
                        <button
                          onClick={() => setModalOpen(true)}
                          className="mt-2 text-xs font-semibold text-primary hover:underline"
                        >
                          Create your first course
                        </button>
                      )}
                    </div>
                  ) : (
                    col.courses.map((c) => <CourseCard key={c.id} course={c} />)
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-mid-grey bg-white">
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
                {(data?.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <p className="text-sm font-medium text-brand-black">No courses found</p>
                        <button
                          onClick={() => setModalOpen(true)}
                          className="mt-2 text-xs font-semibold text-primary hover:underline"
                        >
                          Add your first course to get started
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (data?.data ?? []).map((course) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateCourseModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
