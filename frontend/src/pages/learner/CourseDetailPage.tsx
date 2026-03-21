import { useMemo, useState } from "react";
import axios from "axios";
import { Check, Circle, Clock, Search, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { LearnerNavbar } from "@/components/common/LearnerNavbar";
import { resolveLearnerCourseCta } from "@/lib/learnerCourseCta";
import { cn } from "@/lib/utils";
import { useLearnerCourseDetail } from "@/hooks/useLearnerCatalog";
import { useAuthStore } from "@/stores/authStore";
import type { CourseDetailForLearner, LessonRowStatus } from "@/types/course.types";
import { ReviewsList } from "@/components/learner/reviews/ReviewsList";
import { Skeleton } from "@/components/ui/Skeleton";

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

function formatHoursApprox(seconds: number): string {
  if (seconds <= 0) {
    return "0 hours";
  }
  const h = seconds / 3600;
  if (h < 1) {
    return `${Math.max(1, Math.round(seconds / 60))} min`;
  }
  return `${h.toFixed(1)} hours`;
}

function typeLabel(t: string): string {
  if (!t) {
    return "";
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function isEnrolled(status: CourseDetailForLearner["enrollment_status"]): boolean {
  return status === "enrolled" || status === "in_progress" || status === "completed";
}

function LessonStatusIcon({ status }: { status: LessonRowStatus }) {
  if (status === "completed") {
    return (
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary"
        aria-hidden
      >
        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary"
        aria-hidden
      >
        <Clock className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
      </span>
    );
  }
  return <Circle className="h-4 w-4 shrink-0 text-brand-mid-grey" strokeWidth={2} />;
}

export function CourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: course, isLoading, isError, error } = useLearnerCourseDetail(courseId);
  const [tab, setTab] = useState<"overview" | "reviews">("overview");
  const [lessonSearch, setLessonSearch] = useState("");

  const filteredLessons = useMemo(() => {
    if (!course) {
      return [];
    }
    const q = lessonSearch.trim().toLowerCase();
    if (!q) {
      return course.lessons;
    }
    return course.lessons.filter((l) => l.title.toLowerCase().includes(q));
  }, [course, lessonSearch]);

  const firstLessonTarget = useMemo(() => {
    if (!course?.lessons.length) {
      return null;
    }
    const next = course.lessons.find((l) => l.status !== "completed");
    return next ?? course.lessons[0];
  }, [course]);

  function runHeroCta() {
    if (!course || !courseId) {
      return;
    }
    const cta = resolveLearnerCourseCta({
      isAuthenticated,
      learnerStatus: course.enrollment_status,
      accessRule: course.access_rule,
      priceCents: course.price_cents,
    });
    if (cta.kind === "link") {
      navigate(cta.to);
      return;
    }
    if (cta.disabled) {
      return;
    }
    if (course.access_rule === "on_payment" && (!course.enrollment_status || course.enrollment_status === "not_enrolled")) {
      toast.message("Checkout is not available yet.");
      return;
    }
    if (!firstLessonTarget) {
      toast.message("No lessons in this course yet.");
      return;
    }
    navigate(`/courses/${courseId}/lessons/${firstLessonTarget.lesson_id}`);
  }

  function onLessonRowClick(lessonId: string) {
    if (!course || !courseId) {
      return;
    }
    const enrolled = isEnrolled(course.enrollment_status);
    if (course.access_rule === "on_invitation" && !enrolled) {
      toast.error("Enroll first");
      return;
    }
    if (course.access_rule === "on_payment" && !enrolled) {
      toast.message("Complete purchase to access lessons.");
      return;
    }
    navigate(`/courses/${courseId}/lessons/${lessonId}`);
  }

  if (!courseId) {
    return (
      <div className="min-h-screen bg-brand-light-grey">
        <LearnerNavbar />
        <p className="p-6 text-sm text-brand-dark-grey">Invalid course.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-light-grey">
        <LearnerNavbar />
        <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-6">
          <div className="mb-6 overflow-hidden rounded-xl border border-brand-mid-grey bg-white shadow-sm">
            <Skeleton className="h-[280px] w-full" />
            <div className="p-6">
               <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                     <div className="mb-3 flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                     </div>
                     <Skeleton className="h-9 w-3/4 mb-4" />
                     <Skeleton className="h-4 w-full mb-2" />
                     <Skeleton className="h-4 w-5/6" />
                  </div>
                  <Skeleton className="h-11 w-32 rounded-md shrink-0" />
               </div>
            </div>
          </div>
          <div className="mb-6 flex gap-8 border-b border-brand-mid-grey">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
             {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
             ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !course) {
    const notFound = axios.isAxiosError(error) && error.response?.status === 404;
    return (
      <div className="min-h-screen bg-brand-light-grey">
        <LearnerNavbar />
        <div className="mx-auto max-w-[1200px] px-6 py-10">
          <p className="text-sm text-status-danger" role="alert">
            {notFound ? "This course is not available." : "Could not load this course."}
          </p>
          <Link to="/courses" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const cta = resolveLearnerCourseCta({
    isAuthenticated,
    learnerStatus: course.enrollment_status,
    accessRule: course.access_rule,
    priceCents: course.price_cents,
  });

  const showProgress = isAuthenticated && isEnrolled(course.enrollment_status);
  const pct = Math.min(100, Math.max(0, course.completion_percentage));

  return (
    <div className="min-h-screen bg-brand-light-grey">
      <LearnerNavbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-6">
        <section className="mb-6 overflow-hidden rounded-xl border border-brand-mid-grey bg-white shadow-sm">
          <div
            className={cn(
              "h-[280px] w-full bg-brand-light-grey bg-cover bg-center",
              !course.cover_image_url && "bg-brand-light-grey",
            )}
            style={
              course.cover_image_url ? { backgroundImage: `url(${course.cover_image_url})` } : undefined
            }
          />

          <div className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                {course.tags.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <h1 className="text-[28px] font-bold text-brand-black">{course.title}</h1>

                {course.description ? (
                  <p className="mt-3 whitespace-pre-wrap text-base text-brand-dark-grey">{course.description}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-dark-grey">
                  <span>{course.total_lessons} lessons</span>
                  <span>{formatHoursApprox(course.total_duration_seconds)}</span>
                  {course.average_rating != null ? (
                    <span className="flex items-center gap-1 font-medium text-brand-black">
                      <Star className="h-4 w-4 fill-status-warning text-status-warning" aria-hidden />
                      {course.average_rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>

                {showProgress ? (
                  <div className="mt-6 max-w-xl">
                    <p className="text-sm text-brand-dark-grey">Your Progress</p>
                    <p className="mt-1 text-xl font-bold text-primary">{Math.round(pct)}%</p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-light-grey">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-brand-dark-grey">
                      {course.completed_count} completed · {course.incomplete_count} remaining
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 justify-end lg:pt-1">
                {cta.kind === "link" ? (
                  <Link to={cta.to} className={cta.className}>
                    {cta.label}
                  </Link>
                ) : (
                  <button type="button" className={cta.className} disabled={cta.disabled} onClick={runHeroCta}>
                    {cta.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 flex gap-8 border-b border-brand-mid-grey">
          <button
            type="button"
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition-colors",
              tab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-brand-dark-grey hover:text-brand-black",
            )}
            onClick={() => setTab("overview")}
          >
            Course Overview
          </button>
          <button
            type="button"
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition-colors",
              tab === "reviews"
                ? "border-primary text-primary"
                : "border-transparent text-brand-dark-grey hover:text-brand-black",
            )}
            onClick={() => setTab("reviews")}
          >
            Ratings &amp; Reviews
          </button>
        </div>

        {tab === "reviews" ? (
          <ReviewsList 
            courseId={courseId} 
            isEnrolled={isEnrolled(course.enrollment_status)}
          />
        ) : (
          <>
            <div className="mx-auto mb-6 flex max-w-[560px] items-center gap-2 rounded-lg border border-brand-mid-grey bg-white px-3 shadow-sm">
              <Search className="h-5 w-5 shrink-0 text-brand-dark-grey" aria-hidden />
              <label htmlFor="lesson-search" className="sr-only">
                Search lessons
              </label>
              <input
                id="lesson-search"
                type="search"
                placeholder="Search lessons..."
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                className="h-11 w-full border-0 bg-transparent text-sm text-brand-black outline-none placeholder:text-brand-dark-grey"
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-brand-mid-grey bg-white">
              {filteredLessons.length === 0 ? (
                <p className="p-6 text-sm text-brand-dark-grey">No lessons match your search.</p>
              ) : (
                <ul>
                  {filteredLessons.map((lesson) => (
                    <li key={lesson.lesson_id} className="border-b border-brand-mid-grey last:border-b-0">
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-brand-light-grey/60"
                        onClick={() => onLessonRowClick(lesson.lesson_id)}
                      >
                        <LessonStatusIcon status={lesson.status} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-brand-black">{lesson.title}</p>
                          <p className="text-xs text-brand-dark-grey">{typeLabel(lesson.type)}</p>
                        </div>
                        <span className="shrink-0 text-xs text-brand-dark-grey">
                          {formatDuration(lesson.duration_seconds)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
