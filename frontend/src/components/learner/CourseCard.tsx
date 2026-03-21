import { Clock, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LearnerCourseItem, PublicCourseItem } from "@/types/course.types";

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

function formatInr(priceCents: number): string {
  const rupees = priceCents / 100;
  return rupees % 1 === 0 ? String(Math.round(rupees)) : rupees.toFixed(2);
}

export interface LearnerCourseCardProps {
  course: PublicCourseItem | LearnerCourseItem;
  isAuthenticated: boolean;
}

export function LearnerCourseCard({ course, isAuthenticated }: LearnerCourseCardProps) {
  const navigate = useNavigate();
  const detailPath = `/courses/${course.id}`;
  const status = course.learner_status;
  const pct =
    course.learner_status === "in_progress" && course.completion_percentage != null
      ? Math.min(100, Math.max(0, course.completion_percentage))
      : null;

  type Cta =
    | { kind: "link"; to: string; label: string; className: string }
    | { kind: "button"; label: string; className: string; disabled?: boolean };

  let cta: Cta;
  if (!isAuthenticated) {
    cta = {
      kind: "link",
      to: "/login",
      label: "Join Course",
      className:
        "flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-white hover:bg-primary-hover",
    };
  } else if (!status || status === "not_enrolled") {
    if (course.access_rule === "on_invitation") {
      cta = {
        kind: "button",
        label: "By Invitation Only",
        className:
          "flex h-10 w-full cursor-not-allowed items-center justify-center rounded-md bg-brand-light-grey text-sm font-medium text-brand-dark-grey",
        disabled: true,
      };
    } else if (course.access_rule === "on_payment") {
      const price = course.price_cents != null ? formatInr(course.price_cents) : "—";
      cta = {
        kind: "button",
        label: `Buy Course — ₹${price}`,
        className:
          "flex h-10 w-full items-center justify-center rounded-md bg-status-warning text-sm font-medium text-white hover:opacity-95",
      };
    } else {
      cta = {
        kind: "button",
        label: "Start Learning",
        className:
          "flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-white hover:bg-primary-hover",
      };
    }
  } else if (status === "enrolled") {
    cta = {
      kind: "button",
      label: "Start",
      className:
        "flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-white hover:bg-primary-hover",
    };
  } else if (status === "in_progress") {
    cta = {
      kind: "button",
      label: "Continue",
      className:
        "flex h-10 w-full items-center justify-center rounded-md border-2 border-primary bg-white text-sm font-medium text-primary hover:bg-primary-light",
    };
  } else {
    cta = {
      kind: "button",
      label: "Completed ✓",
      className:
        "flex h-10 w-full cursor-not-allowed items-center justify-center rounded-md border border-status-success/40 bg-[#ECFDF5] text-sm font-medium text-status-success",
      disabled: true,
    };
  }

  function runCta() {
    if (cta.kind === "link") {
      navigate(cta.to);
      return;
    }
    if (cta.disabled) {
      return;
    }
    navigate(detailPath);
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-brand-mid-grey bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div
        className={cn(
          "h-40 w-full bg-cover bg-center",
          !course.cover_image_url && "bg-brand-light-grey",
        )}
        style={
          course.cover_image_url
            ? { backgroundImage: `url(${course.cover_image_url})` }
            : undefined
        }
      />

      <div className="flex flex-1 flex-col p-4">
        {course.tags.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {course.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary"
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

        {pct != null ? (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-brand-dark-grey">
              <span>Progress</span>
              <span>{Math.round(pct)}% complete</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-light-grey">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-4 mt-auto pt-1">
          {cta.kind === "link" ? (
            <Link to={cta.to} className={cta.className}>
              {cta.label}
            </Link>
          ) : (
            <button type="button" className={cta.className} disabled={cta.disabled} onClick={runCta}>
              {cta.label}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export const CourseCard = LearnerCourseCard;
