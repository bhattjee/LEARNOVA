import { BookOpen, Clock, Eye, Share2, SquarePen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDuration } from "@/lib/formatDuration";
import type { CourseListItem } from "@/types/course.types";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  course: CourseListItem;
}

export function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();
  const visibleTags = course.tags.slice(0, 3);
  const more = course.tags.length - visibleTags.length;

  function share() {
    const url = `${window.location.origin}/courses/${course.id}`;
    void navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied!");
    });
  }

  return (
    <div
      className={cn(
        "relative flex min-h-[220px] flex-col rounded-xl border border-brand-mid-grey bg-white p-4 transition-shadow",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
      )}
    >
      <div className="absolute right-4 top-4">
        {course.is_published ? (
          <span className="rounded-full bg-status-success px-2 py-0.5 text-xs font-medium text-white">
            Published
          </span>
        ) : (
          <span className="rounded-full bg-brand-mid-grey px-2 py-0.5 text-xs font-medium text-brand-dark-grey">
            Draft
          </span>
        )}
      </div>

      <h3 className="pr-24 text-base font-bold leading-snug text-brand-black line-clamp-2">
        {course.title}
      </h3>

      {course.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleTags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary"
            >
              {t}
            </span>
          ))}
          {more > 0 ? (
            <span className="rounded-full bg-brand-light-grey px-2 py-0.5 text-xs text-brand-dark-grey">
              +{more} more
            </span>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 h-6" />
      )}

      <div className="mt-auto space-y-1 pt-4 text-xs text-brand-dark-grey">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{course.total_lessons_count} lessons</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{formatDuration(course.total_duration_seconds)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{course.views_count} views</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-brand-mid-grey pt-3">
        <button
          type="button"
          className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium text-primary hover:bg-primary-light"
          onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
        >
          <SquarePen className="h-4 w-4" />
          Edit
        </button>
        <button
          type="button"
          className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium text-primary hover:bg-primary-light"
          onClick={share}
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  );
}
