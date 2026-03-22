import { BookOpen, Clock, Eye, Share2, SquarePen, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDurationClock } from "@/lib/formatDuration";
import { resolvePublicFileUrl } from "@/lib/assetUrl";
import { useUpdateCourse } from "@/hooks/useCourses";
import type { CourseListItem } from "@/types/course.types";
import { cn } from "@/lib/utils";

interface DashboardCourseCardProps {
  course: CourseListItem;
}

export function DashboardCourseCard({ course }: DashboardCourseCardProps) {
  const navigate = useNavigate();
  const updateMutation = useUpdateCourse(course.id);

  function share() {
    const url = `${window.location.origin}/courses/${course.id}`;
    void navigator.clipboard.writeText(url).then(() => {
      toast.success("Course link copied — share it with your audience.");
    });
  }

  async function removeTag(tag: string) {
    const next = course.tags.filter((t) => t !== tag);
    try {
      await updateMutation.mutateAsync({ tags: next });
      toast.success(`Removed tag “${tag}”.`);
    } catch {
      toast.error("Could not update tags.");
    }
  }

  const coverUrl = resolvePublicFileUrl(course.cover_image_url);

  const statusClass = course.is_published ? "bg-status-success" : "bg-status-warning";

  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col rounded-2xl border border-brand-mid-grey bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.1)] sm:flex-row",
      )}
    >
      {coverUrl ? (
        <>
          <div
            className="h-36 w-full shrink-0 bg-slate-200 bg-cover bg-center sm:hidden"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
          <div
            className="relative hidden w-36 shrink-0 bg-slate-200 sm:block sm:w-44"
            style={{ backgroundImage: `url(${coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        </>
      ) : (
        <>
          <div className="h-32 w-full shrink-0 bg-gradient-to-br from-primary-light to-brand-light-grey sm:hidden" />
          <div className="relative hidden w-28 shrink-0 bg-gradient-to-br from-primary-light to-brand-light-grey sm:block sm:w-36" />
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-5 p-4 sm:p-5 md:flex-row md:items-center md:gap-6 md:p-6 lg:gap-8">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <h3 className="min-w-0 flex-1 text-base font-bold leading-snug text-primary sm:text-lg md:text-xl">
              {course.title}
            </h3>
            <span
              className={cn(
                "inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white shadow-sm",
                statusClass,
              )}
              role="status"
            >
              {course.is_published ? "Published" : "Draft"}
            </span>
          </div>
          {course.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-3 border border-brand-mid-grey bg-brand-light-grey/80 px-2.5 py-1 text-xs font-medium text-brand-dark-grey"
                >
                  {tag}
                  <button
                    type="button"
                    className="p-0.5 text-brand-dark-grey transition-colors hover:bg-white hover:text-status-danger"
                    aria-label={`Remove tag ${tag}`}
                    disabled={updateMutation.isPending}
                    onClick={() => void removeTag(tag)}
                  >
                    <X className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs italic text-brand-dark-grey">No tags yet — add them when editing the course.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6 border-t border-brand-mid-grey/80 pt-4 text-sm md:border-0 md:pt-0">
          <div className="flex min-w-[72px] flex-col gap-0.5">
            <span className="flex items-center gap-1 text-xs font-medium text-brand-dark-grey">
              <Eye className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              Views
            </span>
            <span className="text-base font-bold tabular-nums text-brand-black">{course.views_count}</span>
          </div>
          <div className="flex min-w-[72px] flex-col gap-0.5">
            <span className="flex items-center gap-1 text-xs font-medium text-brand-dark-grey">
              <BookOpen className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              Contents
            </span>
            <span className="text-base font-bold tabular-nums text-brand-black">{course.total_lessons_count}</span>
          </div>
          <div className="flex min-w-[72px] flex-col gap-0.5">
            <span className="flex items-center gap-1 text-xs font-medium text-brand-dark-grey">
              <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              Duration
            </span>
            <span className="text-base font-bold tabular-nums text-brand-black">
              {formatDurationClock(course.total_duration_seconds)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-brand-mid-grey/80 pt-4 md:border-0 md:pt-0">
          <button
            type="button"
            onClick={share}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-light md:flex-none"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            type="button"
            onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover md:flex-none"
          >
            <SquarePen className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}
