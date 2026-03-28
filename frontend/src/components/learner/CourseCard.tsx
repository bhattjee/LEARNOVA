import { Clock, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { resolvePublicFileUrl } from "@/lib/assetUrl";
import { cn } from "@/lib/utils";
import { formatInr, resolveLearnerCourseCta } from "@/lib/learnerCourseCta";
import type { LearnerCourseItem, PublicCourseItem } from "@/types/course.types";

function isLearnerEnrolled(
  status: PublicCourseItem["learner_status"],
): boolean {
  return status === "enrolled" || status === "in_progress" || status === "completed";
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return "0 min";
  }
  const m = Math.floor(totalSeconds / 60);
  if (m < 60) {
    return `${m} min`;
  }
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

export interface LearnerCourseCardProps {
  course: PublicCourseItem | LearnerCourseItem;
  isAuthenticated: boolean;
  /** When set, primary actions navigate here instead of course detail (showcase / demo cards). */
  showcaseDestination?: string;
  /** Opens mock checkout for paid courses instead of navigating away. */
  onPaidCheckout?: (course: PublicCourseItem | LearnerCourseItem) => void;
}

export function LearnerCourseCard({
  course,
  isAuthenticated,
  showcaseDestination,
  onPaidCheckout,
}: LearnerCourseCardProps) {
  const navigate = useNavigate();
  const detailPath = `/courses/${course.id}`;
  const status = course.learner_status;
  const pct =
    course.learner_status === "in_progress" && course.completion_percentage != null
      ? Math.min(100, Math.max(0, course.completion_percentage))
      : null;

  const cta = resolveLearnerCourseCta({
    isAuthenticated,
    learnerStatus: status,
    accessRule: course.access_rule,
    priceCents: course.price_cents,
  });

  function runCta() {
    if (showcaseDestination) {
      navigate(showcaseDestination);
      return;
    }
    if (cta.kind === "link") {
      navigate(cta.to);
      return;
    }
    if (cta.disabled) {
      return;
    }
    navigate(detailPath);
  }

  const enrolled = isLearnerEnrolled(status);
  const showPaidRibbon =
    course.access_rule === "on_payment" &&
    course.price_cents != null &&
    course.price_cents > 0 &&
    !enrolled;

  const openMockCheckout =
    Boolean(onPaidCheckout) &&
    isAuthenticated &&
    course.access_rule === "on_payment" &&
    !enrolled &&
    !showcaseDestination;

  function onPrimaryAction() {
    if (openMockCheckout && onPaidCheckout) {
      onPaidCheckout(course);
      return;
    }
    runCta();
  }

  const coverUrl = resolvePublicFileUrl(course.cover_image_url);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-brand-mid-grey/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_12px_40px_rgba(15,23,42,0.1)]">
      <div className="relative">
        <div
          className={cn(
            "h-44 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.02]",
            !coverUrl && "bg-gradient-to-br from-primary-light to-brand-light-grey",
          )}
          style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
          aria-hidden
        />
        {showPaidRibbon ? (
          <span className="absolute right-3 top-3 rounded-md bg-status-success px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
            Paid
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {course.tags.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {course.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#F5F0FF] px-2.5 py-0.5 text-xs font-semibold text-status-purple"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <h3 className="line-clamp-2 text-base font-bold text-brand-black">{course.title}</h3>

        {course.description_short ? (
          <p className="mt-1 line-clamp-3 text-[13px] text-brand-dark-grey">{course.description_short}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-dark-grey">
          <span>{course.total_lessons_count} lessons</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatDuration(course.total_duration_seconds)}
          </span>
          {course.average_rating != null ? (
            <span className="flex items-center gap-0.5 font-medium text-brand-black">
              <Star className="h-3.5 w-3.5 fill-status-warning text-status-warning" aria-hidden />
              {course.average_rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        {course.access_rule === "on_payment" && course.price_cents != null && !enrolled ? (
          <p className="mt-3 text-right text-sm font-bold text-brand-black">
            INR {formatInr(course.price_cents)}
          </p>
        ) : null}

        {pct != null ? (
          <div className="mt-4 mt-auto space-y-2 pt-1">
            <div className="flex justify-between text-xs text-brand-dark-grey">
              <span>Progress</span>
              <span>{Math.round(pct)}% complete</span>
            </div>
            <div className="flex flex-nowrap items-center gap-4">
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-brand-light-grey">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-status-purple transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="shrink-0">
                {cta.kind === "link" ? (
                  <Link
                    to={showcaseDestination ?? cta.to}
                    className={cn(
                      cta.className,
                      "inline-flex min-h-[2.5rem] items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm",
                    )}
                  >
                    {cta.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      cta.className,
                      "inline-flex min-h-[2.5rem] items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm",
                      cta.label.startsWith("Continue") &&
                        "border-2 border-status-purple bg-white text-status-purple hover:bg-[#F5F0FF]",
                      cta.label.includes("Buy Course") &&
                        "bg-status-purple text-white hover:bg-status-purple/90 hover:opacity-95",
                    )}
                    disabled={cta.disabled}
                    onClick={onPrimaryAction}
                  >
                    {cta.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 mt-auto pt-1">
            {cta.kind === "link" ? (
              <Link
                to={showcaseDestination ?? cta.to}
                className={cn(cta.className, "w-full rounded-xl")}
              >
                {cta.label}
              </Link>
            ) : (
              <button
                type="button"
                className={cn(
                  cta.className,
                  "w-full rounded-xl",
                  cta.label.startsWith("Continue") &&
                    "border-status-purple bg-white text-status-purple hover:bg-[#F5F0FF]",
                  cta.label.includes("Buy Course") &&
                    "bg-status-purple text-white hover:bg-status-purple/90 hover:opacity-95",
                )}
                disabled={cta.disabled}
                onClick={onPrimaryAction}
              >
                {cta.label}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export const CourseCard = LearnerCourseCard;
