import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Circle, Clock, GraduationCap, Paperclip } from "lucide-react";
import ReactPlayer from "react-player";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { LEARNER_DETAIL_KEY, MY_COURSES_KEY, useLearnerCourseDetail } from "@/hooks/useLearnerCatalog";
import { completeLearnerCourse } from "@/services/learnerCatalogService";
import * as progressService from "@/services/progressService";
import { usePlayerStore } from "@/stores/playerStore";
import { cn } from "@/lib/utils";
import type { LessonItem } from "@/types/lesson.types";
import type { LessonRowStatus } from "@/types/course.types";
import { QuizPlayer } from "@/components/learner/LessonPlayer/QuizPlayer";

function formatDurationShort(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return "0m";
  }
  const m = Math.floor(totalSeconds / 60);
  if (m < 60) {
    return `${m}m`;
  }
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

function typeLabel(t: string): string {
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

function SidebarStatusIcon({ status }: { status: LessonRowStatus }) {
  if (status === "completed") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-status-success" aria-hidden>
        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary" aria-hidden>
        <Clock className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
      </span>
    );
  }
  return <Circle className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={2} />;
}

export function LessonPlayerPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sidebarOpen = usePlayerStore((s) => s.sidebarOpen);
  const toggleSidebar = usePlayerStore((s) => s.toggleSidebar);
  const setActiveLesson = usePlayerStore((s) => s.setActiveLesson);
  const resetTimer = usePlayerStore((s) => s.resetTimer);
  const tickTimer = usePlayerStore((s) => s.tickTimer);
  const setVisibilityPaused = usePlayerStore((s) => s.setVisibilityPaused);

  const manualCompleteRef = useRef(false);
  const [celebration, setCelebration] = useState<{ title: string; completionDate: string } | null>(null);

  const {
    data: course,
    isLoading: courseLoading,
    isError: courseError,
  } = useLearnerCourseDetail(courseId);

  const {
    data: lesson,
    isLoading: lessonLoading,
    isError: lessonError,
  } = useQuery({
    queryKey: ["player-lesson", courseId, lessonId],
    queryFn: () => progressService.getPlayerLesson(courseId!, lessonId!),
    enabled: Boolean(courseId && lessonId),
  });

  const sortedLessons = useMemo(() => {
    if (!course?.lessons?.length) {
      return [];
    }
    return [...course.lessons].sort((a, b) => a.sort_order - b.sort_order);
  }, [course?.lessons]);

  const lessonIndex = useMemo(
    () => sortedLessons.findIndex((l) => l.lesson_id === lessonId),
    [sortedLessons, lessonId],
  );
  const nextLessonId = lessonIndex >= 0 ? sortedLessons[lessonIndex + 1]?.lesson_id : undefined;
  const isLastLesson = Boolean(sortedLessons.length && lessonIndex === sortedLessons.length - 1);

  const completionPct = course ? Math.min(100, Math.max(0, course.completion_percentage)) : 0;

  const allLessonsDone = Boolean(
    course && course.total_lessons > 0 && course.completed_count >= course.total_lessons,
  );

  const sendComplete = useCallback(
    async (seconds: number) => {
      if (!courseId || !lessonId) {
        return;
      }
      try {
        const res = await progressService.completeLesson({
          lesson_id: lessonId,
          course_id: courseId,
          time_spent_seconds: Math.max(0, Math.floor(seconds)),
        });
        void queryClient.invalidateQueries({ queryKey: [LEARNER_DETAIL_KEY] });
        void queryClient.invalidateQueries({ queryKey: ["player-lesson"] });
      } catch {
        /* avoid blocking navigation */
      }
    },
    [courseId, lessonId, queryClient],
  );

  useEffect(() => {
    if (!courseId || !lessonId) {
      return;
    }
    manualCompleteRef.current = false;
    setActiveLesson(courseId, lessonId);
    resetTimer();

    void progressService
      .startLesson({ lesson_id: lessonId, course_id: courseId })
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: [LEARNER_DETAIL_KEY] });
      })
      .catch(() => {
        /* optional: toast */
      });

    return () => {
      if (manualCompleteRef.current) {
        return;
      }
      const secs = usePlayerStore.getState().elapsedSeconds;
      void sendComplete(secs);
    };
  }, [courseId, lessonId, queryClient, resetTimer, sendComplete, setActiveLesson]);

  useEffect(() => {
    const onVis = () => setVisibilityPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [setVisibilityPaused]);

  useEffect(() => {
    const id = window.setInterval(() => tickTimer(), 1000);
    return () => window.clearInterval(id);
  }, [tickTimer]);

  async function onNextContent() {
    if (!courseId || !lessonId || isLastLesson) {
      return;
    }
    manualCompleteRef.current = true;
    const secs = usePlayerStore.getState().elapsedSeconds;
    try {
      await progressService.completeLesson({
        lesson_id: lessonId,
        course_id: courseId,
        time_spent_seconds: Math.max(0, Math.floor(secs)),
      });
      void queryClient.invalidateQueries({ queryKey: [LEARNER_DETAIL_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["player-lesson"] });
      resetTimer();
      if (nextLessonId) {
        navigate(`/courses/${courseId}/lessons/${nextLessonId}`);
      }
    } catch {
      manualCompleteRef.current = false;
      toast.error("Could not save progress.");
    }
  }

  async function onCompleteCourse() {
    if (!courseId || !course) {
      return;
    }
    try {
      const res = await completeLearnerCourse(courseId);
      void queryClient.invalidateQueries({ queryKey: [LEARNER_DETAIL_KEY] });
      void queryClient.invalidateQueries({ queryKey: [MY_COURSES_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["public-courses"] });
      setCelebration({
        title: course.title,
        completionDate: res.completion_date,
      });
    } catch {
      toast.error("Could not complete the course.");
    }
  }

  if (!courseId || !lessonId) {
    return <div className="flex h-screen items-center justify-center bg-[#0F172A] text-slate-400">Invalid lesson.</div>;
  }

  if (courseLoading || lessonLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#0F172A] text-slate-400">Loading…</div>;
  }

  if (courseError || !course) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0F172A] text-slate-400">
        <p>Could not load this course.</p>
        <Link to="/courses" className="text-primary hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0F172A] text-slate-400">
        <p>Could not load this lesson.</p>
        <Link to={`/courses/${courseId}`} className="text-primary hover:underline">
          Back to course
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0F172A]">
      {sidebarOpen ? (
        <aside className="flex w-[320px] shrink-0 flex-col bg-[#1E293B] text-white">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <Link
              to={`/courses/${courseId}`}
              className="text-sm text-white/90 transition-colors hover:text-white"
            >
              ← Back
            </Link>
            <button
              type="button"
              aria-label="Collapse sidebar"
              className="rounded p-1 text-white/80 hover:bg-white/10"
              onClick={() => toggleSidebar()}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="line-clamp-2 px-5 py-4 text-sm font-semibold leading-snug">
            {course?.title ?? "Course"}
          </div>

          <div className="px-5 pb-4">
            <p className="text-xs text-slate-400">{Math.round(completionPct)}% complete</p>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-700">
              <div className="h-full bg-primary transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-2" aria-label="Lessons">
            {sortedLessons.map((row) => {
              const active = row.lesson_id === lessonId;
              const showAtt = active && lesson.attachments.length > 0;
              return (
                <div key={row.lesson_id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/courses/${courseId}/lessons/${row.lesson_id}`)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 px-5 py-3 text-left transition-colors",
                      active ? "border-l-[3px] border-l-primary bg-[rgba(29,78,216,0.3)]" : "border-l-[3px] border-l-transparent",
                      !active && "hover:bg-white/5",
                    )}
                  >
                    <SidebarStatusIcon status={row.status} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white">{row.title}</p>
                      <p className="text-[11px] text-slate-400">{typeLabel(row.type)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDurationShort(row.duration_seconds)}
                    </span>
                  </button>
                  {showAtt ? (
                    <ul className="border-l border-white/10 pb-2 pl-12 pr-5">
                      {lesson.attachments.map((a) => (
                        <li key={a.id} className="py-1">
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
                          >
                            <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {a.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : row.has_attachments && !active ? (
                    <div className="px-5 pb-2 pl-14 text-xs text-slate-500">📎 Resources available</div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>
      ) : (
        <button
          type="button"
          aria-label="Open sidebar"
          className="fixed left-0 top-28 z-30 flex h-14 w-9 items-center justify-center rounded-r-md bg-primary text-white shadow-md"
          onClick={() => toggleSidebar()}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <h1 className="truncate pr-4 text-base font-semibold text-white">{lesson.title}</h1>
          {allLessonsDone ? (
            <button
              type="button"
              onClick={() => void onCompleteCourse()}
              className="shrink-0 rounded-md bg-[#058E61] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-95"
            >
              Complete this Course
            </button>
          ) : (
            <button
              type="button"
              disabled={isLastLesson}
              onClick={() => void onNextContent()}
              className={cn(
                "shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors",
                isLastLesson
                  ? "cursor-not-allowed bg-slate-600 opacity-50"
                  : "bg-primary hover:bg-primary-hover",
              )}
            >
              Next Content
            </button>
          )}
        </header>

        {lesson.description?.trim() ? (
          <div className="mx-6 mt-4 border-l-[3px] border-primary bg-white/5 px-6 py-4 text-sm italic leading-relaxed text-slate-300">
            {lesson.description}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          <LessonViewer lesson={lesson} />
        </div>
      </div>

      {celebration ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-complete-title"
        >
          <div className="w-full max-w-[480px] rounded-2xl bg-white p-10 text-center shadow-2xl">
            <div className="course-complete-cap mx-auto mb-6 flex justify-center text-6xl" aria-hidden>
              <GraduationCap className="h-20 w-20 text-primary" strokeWidth={1.25} />
            </div>
            <h2 id="course-complete-title" className="text-[28px] font-bold text-[#0F172A]">
              Course Completed!
            </h2>
            <p className="mt-2 text-base text-[#464749]">{celebration.title}</p>
            <p className="mt-4 text-sm text-[#464749]">
              Completed on{" "}
              <span className="font-medium text-[#0F172A]">
                {new Date(celebration.completionDate).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                disabled
                className="h-11 w-full cursor-not-allowed rounded-lg border border-brand-mid-grey bg-brand-light-grey text-sm font-semibold text-brand-dark-grey"
              >
                View Certificate
              </button>
              <Link
                to="/my-courses"
                className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-hover"
                onClick={() => setCelebration(null)}
              >
                Back to My Courses
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LessonViewer({ lesson }: { lesson: LessonItem }) {
  if (lesson.type === "video") {
    if (!lesson.video_url) {
      return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/20 p-8 text-sm text-slate-400">
          No video URL configured for this lesson.
        </div>
      );
    }
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-black/40">
        <div className="aspect-video w-full max-h-full max-w-[1200px]">
          <ReactPlayer url={lesson.video_url} controls width="100%" height="100%" />
        </div>
      </div>
    );
  }

  if (lesson.type === "document") {
    if (!lesson.file_url) {
      return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/20 p-8 text-sm text-slate-400">
          No document URL configured for this lesson.
        </div>
      );
    }
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white">
        <iframe title={lesson.title} src={lesson.file_url} className="h-full min-h-[400px] w-full flex-1 border-0" />
      </div>
    );
  }

  if (lesson.type === "image") {
    if (!lesson.file_url) {
      return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/20 p-8 text-sm text-slate-400">
          No image URL configured for this lesson.
        </div>
      );
    }
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg bg-black/20 p-4">
        <img
          src={lesson.file_url}
          alt={lesson.title}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  if (lesson.type === "quiz") {
    return <QuizPlayer quizId={lesson.quiz_id || lesson.id} />;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-white/20 p-8 text-center text-slate-400">
      <p className="text-sm">Quiz player will be available in Phase 11.</p>
      <p className="text-xs text-slate-500">Add a video URL, document, or image for this lesson to preview content here.</p>
    </div>
  );
}
