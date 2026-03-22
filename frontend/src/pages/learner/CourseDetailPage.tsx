import { useMemo, useState } from "react";
import axios from "axios";
import { Check, Circle, Lock, Search, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { LearnerNavbar } from "@/components/common/LearnerNavbar";
import { PaidCourseCheckoutModal } from "@/components/learner/PaidCourseCheckoutModal";
import { resolveLearnerCourseCta } from "@/lib/learnerCourseCta";
import { resolvePublicFileUrl } from "@/lib/assetUrl";
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

function isLessonRowLocked(course: CourseDetailForLearner): boolean {
  const enrolled = isEnrolled(course.enrollment_status);
  if (course.access_rule === "on_invitation" && !enrolled) {
    return true;
  }
  if (course.access_rule === "on_payment" && !enrolled) {
    return true;
  }
  return false;
}

function LessonOutlineIcon({
  status,
  locked,
}: {
  status: LessonRowStatus;
  locked: boolean;
}) {
  if (locked) {
    return <Lock className="h-5 w-5 shrink-0 text-amber-400/90" aria-hidden />;
  }
  if (status === "completed") {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]"
        aria-hidden
      >
        <Check className="h-4 w-4 text-white" strokeWidth={3} />
      </span>
    );
  }
  return (
    <Circle className="h-8 w-8 shrink-0 text-zinc-500" strokeWidth={2} aria-hidden />
  );
}

const pageBg = "min-h-screen bg-slate-200 text-brand-black";

export function CourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: course, isLoading, isError, error } = useLearnerCourseDetail(courseId);
  const [tab, setTab] = useState<"overview" | "reviews">("overview");
  const [lessonSearch, setLessonSearch] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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
      setCheckoutOpen(true);
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
      setCheckoutOpen(true);
      return;
    }
    navigate(`/courses/${courseId}/lessons/${lessonId}`);
  }

  if (!courseId) {
    return (
      <div className={pageBg}>
        <LearnerNavbar variant="dark" />
        <p className="p-6 text-sm text-zinc-400">Invalid course.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={pageBg}>
        <LearnerNavbar variant="dark" />
        <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-4 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#1a1a1a]">
            <Skeleton className="h-[220px] w-full bg-zinc-800 sm:h-[280px]" />
            <div className="p-6">
              <div className="flex flex-col gap-6 lg:flex-row">
                <Skeleton className="h-28 w-28 shrink-0 rounded-xl bg-zinc-800" />
                <div className="min-w-0 flex-1 space-y-3">
                  <Skeleton className="h-5 w-20 rounded-full bg-zinc-800" />
                  <Skeleton className="h-9 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-4 w-full bg-zinc-800" />
                </div>
                <Skeleton className="h-40 w-full shrink-0 rounded-xl bg-zinc-800 lg:w-64" />
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-64 rounded-lg bg-zinc-800" />
            <Skeleton className="h-10 w-full max-w-xs rounded-lg bg-zinc-800" />
          </div>
          <div className="mt-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-zinc-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !course) {
    const notFound = axios.isAxiosError(error) && error.response?.status === 404;
    return (
      <div className={pageBg}>
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
  const rowLocked = isLessonRowLocked(course);
  const contentCountLabel =
    lessonSearch.trim() && filteredLessons.length !== course.total_lessons
      ? filteredLessons.length
      : course.total_lessons;

  const coverUrl = resolvePublicFileUrl(course.cover_image_url);

  return (
    <div className={pageBg}>
      <LearnerNavbar />

      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-4 sm:px-6">
        {/* Hero: cover + thumbnail + title + progress / CTA */}
        <section className="overflow-hidden rounded-[32px] border border-brand-mid-grey bg-white shadow-xl shadow-black/5">
          <div className="relative min-h-[200px] sm:min-h-[240px]">
            <div
              className={cn(
                "absolute inset-0 bg-brand-light-grey bg-cover bg-center",
                !coverUrl && "bg-gradient-to-br from-brand-light-grey to-brand-mid-grey",
              )}
              style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/10" />

            {course.access_rule === "on_payment" &&
            course.price_cents != null &&
            !isEnrolled(course.enrollment_status) ? (
              <span className="absolute right-4 top-4 z-10 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                Paid
              </span>
            ) : null}

            <div className="relative z-[1] flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-start lg:gap-8">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-[24px] border-2 border-white bg-brand-light-grey shadow-lg">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light to-brand-mid-grey text-xs font-medium text-brand-dark-grey"
                    aria-hidden
                  >
                    Course
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  Course
                </span>
                <h1 className="mt-3 text-2xl font-bold leading-tight text-brand-black sm:text-[28px]">
                  {course.title}
                </h1>
                {course.description ? (
                  <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-brand-dark-grey">
                    {course.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-dark-grey sm:text-sm">
                  <span>{course.total_lessons} lessons</span>
                  <span>{formatHoursApprox(course.total_duration_seconds)}</span>
                  {course.average_rating != null ? (
                    <span className="flex items-center gap-1 font-medium text-brand-dark-grey">
                      <Star className="h-4 w-4 fill-status-warning text-status-warning" aria-hidden />
                      {course.average_rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="w-full shrink-0 lg:w-[280px]">
                {showProgress ? (
                  <div className="rounded-[24px] bg-[#475569] p-5 shadow-lg">
                    <p className="text-center text-sm font-semibold text-white">
                      {Math.round(pct)}% Completed
                    </p>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-status-success transition-[width]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-slate-800/50 px-1 py-2">
                        <p className="text-lg font-bold tabular-nums text-white">{course.total_lessons}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-300">Content</p>
                      </div>
                      <div className="rounded-xl bg-slate-800/50 px-1 py-2">
                        <p className="text-lg font-bold tabular-nums text-status-success">{course.completed_count}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-300">Completed</p>
                      </div>
                      <div className="rounded-xl bg-slate-800/50 px-1 py-2">
                        <p className="text-lg font-bold tabular-nums text-slate-300">{course.incomplete_count}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-300">Incomplete</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 rounded-[24px] bg-[#475569] p-5 shadow-lg">
                    <p className="text-center text-xs text-slate-200">
                      {course.access_rule === "on_payment" && !isEnrolled(course.enrollment_status)
                        ? "Purchase to unlock all lessons and track progress."
                        : course.access_rule === "on_invitation" && !isEnrolled(course.enrollment_status)
                          ? "This course is available by invitation only."
                          : "Sign in to start learning and track your progress."}
                    </p>
                    {cta.kind === "link" ? (
                      <Link
                        to={cta.to}
                        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover"
                      >
                        {cta.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={cn(
                          "inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                          cta.disabled
                            ? "border border-brand-mid-grey bg-brand-light-grey text-brand-dark-grey"
                            : cta.label === "Continue"
                                ? "border-2 border-primary bg-white text-primary hover:bg-primary-light"
                                : "bg-primary text-white hover:bg-primary-hover",
                        )}
                        disabled={cta.disabled}
                        onClick={runHeroCta}
                      >
                        {cta.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs + search (overview) */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-bold transition-colors",
                tab === "overview"
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-brand-light-grey text-brand-dark-grey hover:bg-brand-mid-grey/30 hover:text-brand-black",
              )}
              onClick={() => setTab("overview")}
            >
              Course Overview
            </button>
            <button
              type="button"
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-bold transition-colors",
                tab === "reviews"
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-brand-light-grey text-brand-dark-grey hover:bg-brand-mid-grey/30 hover:text-brand-black",
              )}
              onClick={() => setTab("reviews")}
            >
              Ratings and Reviews
            </button>
          </div>

          {tab === "overview" ? (
            <div className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-brand-mid-grey bg-white px-3 py-2 sm:max-w-xs sm:shrink-0 lg:max-w-sm">
              <Search className="h-5 w-5 shrink-0 text-brand-dark-grey" aria-hidden />
              <label htmlFor="lesson-search" className="sr-only">
                Search content
              </label>
              <input
                id="lesson-search"
                type="search"
                placeholder="Search content"
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                className="h-9 w-full border-0 bg-transparent text-sm text-brand-black outline-none placeholder:text-brand-dark-grey"
              />
            </div>
          ) : null}
        </div>

        {tab === "reviews" ? (
          <div className="mt-8">
            <ReviewsList courseId={courseId} isEnrolled={isEnrolled(course.enrollment_status)} variant="light" />
          </div>
        ) : (
          <>
            <div className="mt-8 border-b border-brand-mid-grey pb-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-dark-grey">
                {contentCountLabel} {contentCountLabel === 1 ? "Content" : "Contents"}
              </h2>
            </div>

            <div className="mt-4 overflow-hidden rounded-[24px] border border-brand-mid-grey bg-white">
              {filteredLessons.length === 0 ? (
                <p className="p-6 text-sm text-brand-dark-grey">No lessons match your search.</p>
              ) : (
                <ul>
                  {filteredLessons.map((lesson) => {
                    const order =
                      course.lessons.findIndex((l) => l.lesson_id === lesson.lesson_id) + 1;
                    return (
                      <li key={lesson.lesson_id} className="border-b border-brand-mid-grey last:border-b-0">
                        <button
                          type="button"
                          className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-brand-light-grey sm:px-5"
                          onClick={() => onLessonRowClick(lesson.lesson_id)}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-bold leading-snug text-brand-black">
                              <span className="mr-2 font-normal text-brand-dark-grey">#{order}</span>
                              {lesson.title}
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-brand-dark-grey">{typeLabel(lesson.type)}</p>
                          </div>
                          <span className="hidden shrink-0 text-xs font-semibold tabular-nums text-brand-dark-grey sm:inline">
                            {formatDuration(lesson.duration_seconds)}
                          </span>
                          <LessonOutlineIcon status={lesson.status} locked={rowLocked} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      <PaidCourseCheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        courseId={courseId ?? null}
        courseTitle={course.title}
        priceCents={course.price_cents}
      />
    </div>
  );
}
