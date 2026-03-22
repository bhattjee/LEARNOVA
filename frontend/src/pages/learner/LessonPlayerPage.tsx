import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, GraduationCap, Menu, Paperclip } from "lucide-react";
import ReactPlayer from "react-player";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { LEARNER_DETAIL_KEY, MY_COURSES_KEY, useLearnerCourseDetail } from "@/hooks/useLearnerCatalog";
import { completeLearnerCourse } from "@/services/learnerCatalogService";
import * as authService from "@/services/authService";
import * as progressService from "@/services/progressService";
import { usePlayerStore } from "@/stores/playerStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { formatPlaybackClock, getVideoStartSeconds } from "@/lib/videoUrl";
import type { LessonItem } from "@/types/lesson.types";
import type { LessonRowStatus } from "@/types/course.types";
import type { SubmitResult } from "@/types/quiz.types";
import { CompletionCertificate } from "@/components/learner/CompletionCertificate";
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

function SidebarStatusIcon({ status, active }: { status: LessonRowStatus; active: boolean }) {
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
  if (status === "in_progress") {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#3B82F6] bg-[#3B82F6]/20"
        aria-hidden
      >
        <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-zinc-500 bg-transparent",
        active && "border-[#3B82F6] ring-2 ring-[#3B82F6]/35",
      )}
      aria-hidden
    />
  );
}

interface QuizSummary {
  points: number;
  scorePct: number;
  completedAt: string;
  lessonTitle: string;
}

const QUIZ_STORAGE_PREFIX = "learnova-quiz-summary-";

function readQuizSummary(courseId: string): QuizSummary | null {
  try {
    const raw = sessionStorage.getItem(`${QUIZ_STORAGE_PREFIX}${courseId}`);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as QuizSummary;
  } catch {
    return null;
  }
}

function writeQuizSummary(courseId: string, s: QuizSummary) {
  try {
    sessionStorage.setItem(`${QUIZ_STORAGE_PREFIX}${courseId}`, JSON.stringify(s));
  } catch {
    /* ignore */
  }
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
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [quizSummary, setQuizSummary] = useState<QuizSummary | null>(null);
  const authUser = useAuthStore((s) => s.user);

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

  const typeCounts = useMemo(() => {
    const c = { video: 0, document: 0, quiz: 0, image: 0 };
    for (const row of sortedLessons) {
      if (row.type in c) {
        c[row.type as keyof typeof c]++;
      }
    }
    return c;
  }, [sortedLessons]);

  useEffect(() => {
    if (!courseId) {
      return;
    }
    setQuizSummary(readQuizSummary(courseId));
  }, [courseId]);

  useEffect(() => {
    if (!celebration) {
      setCertificateOpen(false);
    }
  }, [celebration]);

  const sendComplete = useCallback(
    async (seconds: number) => {
      if (!courseId || !lessonId) {
        return;
      }
      try {
        await progressService.completeLesson({
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
        /* optional */
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

  const onQuizComplete = useCallback(
    (result: SubmitResult, completedAtIso: string) => {
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.getState().setUser({ ...authUser, total_points: result.total_points_now });
      }
      void authService
        .getMe()
        .then((u) => useAuthStore.getState().setUser(u))
        .catch(() => {
          /* keep optimistic total_points */
        });
      if (!course?.title || !lessonId) {
        return;
      }
      const row = sortedLessons.find((l) => l.lesson_id === lessonId);
      const title = row?.title ?? "Quiz";
      const summary: QuizSummary = {
        points: result.points_awarded,
        scorePct: result.score_percentage,
        completedAt: completedAtIso,
        lessonTitle: title,
      };
      setQuizSummary(summary);
      if (courseId) {
        writeQuizSummary(courseId, summary);
      }
      void queryClient.invalidateQueries({ queryKey: [LEARNER_DETAIL_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["player-lesson"] });
      void queryClient.invalidateQueries({ queryKey: ["quiz-intro"] });
    },
    [course?.title, courseId, lessonId, queryClient, sortedLessons],
  );

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
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F172A] text-slate-400">Invalid lesson.</div>
    );
  }

  if (courseLoading || lessonLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F172A] text-slate-400">Loading…</div>
    );
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
        <aside className="flex w-[320px] shrink-0 flex-col border-r border-white/10 bg-[#1E293B] text-white">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <Link
              to="/my-courses"
              className="text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              ← Back
            </Link>
            <button
              type="button"
              aria-label="Collapse course sidebar"
              className="rounded p-1.5 text-white/80 hover:bg-white/10"
              onClick={() => toggleSidebar()}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="line-clamp-2 px-4 py-3 text-sm font-semibold leading-snug">{course.title}</div>

          <div className="px-4 pb-3">
            <p className="text-xs font-medium text-orange-300">{Math.round(completionPct)}% Completed</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {quizSummary ? (
            <div className="mx-4 mb-3 rounded-lg border border-[#3B82F6]/40 bg-[#0f172a]/80 px-3 py-2.5 text-[11px] leading-relaxed text-zinc-300">
              <p className="font-semibold text-[#93C5FD]">Latest quiz</p>
              <p className="mt-1 text-zinc-400">{quizSummary.lessonTitle}</p>
              <p className="mt-1 tabular-nums text-white">
                +{quizSummary.points} pts · {Math.round(quizSummary.scorePct)}% score
              </p>
              <p className="mt-1 text-zinc-500">
                {new Date(quizSummary.completedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          ) : null}

          <div className="border-t border-white/10 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Course includes</p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-zinc-400">
              <li>
                <span className="text-zinc-500">Video </span>
                {typeCounts.video > 0 ? (
                  <span className="text-zinc-200">{typeCounts.video}</span>
                ) : (
                  <span className="italic text-zinc-400">None</span>
                )}
              </li>
              <li>
                <span className="text-zinc-500">Document </span>
                {typeCounts.document > 0 ? (
                  <span className="text-zinc-200">{typeCounts.document}</span>
                ) : (
                  <span className="italic text-zinc-400">Not uploaded</span>
                )}
              </li>
              <li>
                <span className="text-zinc-500">Quiz </span>
                {typeCounts.quiz > 0 ? (
                  <span className="text-zinc-200">{typeCounts.quiz}</span>
                ) : (
                  <span className="italic text-zinc-400">None</span>
                )}
              </li>
              <li>
                <span className="text-zinc-500">Image </span>
                {typeCounts.image > 0 ? (
                  <span className="text-zinc-200">{typeCounts.image}</span>
                ) : (
                  <span className="italic text-zinc-400">None</span>
                )}
              </li>
            </ul>
          </div>

          <nav className="flex-1 overflow-y-auto py-2" aria-label="Lessons">
            {sortedLessons.map((row) => {
              const active = row.lesson_id === lessonId;
              const showAtt = active && lesson.attachments.length > 0;
              return (
                <div key={row.lesson_id} className="border-b border-white/5">
                  <button
                    type="button"
                    onClick={() => navigate(`/courses/${courseId}/lessons/${row.lesson_id}`)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors",
                      active ? "bg-[rgba(59,130,246,0.15)]" : "hover:bg-white/5",
                    )}
                  >
                    <SidebarStatusIcon status={row.status} active={active} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug text-white">{row.title}</p>
                      <p className="text-[11px] text-slate-400">{typeLabel(row.type)}</p>
                      </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDurationShort(row.duration_seconds)}
                    </span>
                  </button>

                  <div className="px-4 pb-3 pl-[52px]">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Attachments</p>
                    {showAtt ? (
                      <ul className="mt-1 space-y-1">
                        {lesson.attachments.map((a) => (
                          <li key={a.id}>
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-[#93C5FD] hover:underline"
                            >
                              <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              {a.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : active ? (
                      <p className="mt-1 text-xs italic text-zinc-500">Not uploaded</p>
                    ) : row.has_attachments ? (
                      <p className="mt-1 text-xs text-zinc-400">Resources available — open this lesson</p>
                    ) : (
                      <p className="mt-1 text-xs italic text-zinc-500">None</p>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>
      ) : (
        <button
          type="button"
          aria-label="Open sidebar"
          className="fixed left-0 top-28 z-30 flex h-14 w-9 items-center justify-center rounded-r-md bg-[#3B82F6] text-white shadow-md"
          onClick={() => toggleSidebar()}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {!sidebarOpen ? (
              <button
                type="button"
                aria-label="Open menu"
                className="shrink-0 rounded p-1 text-white/80 hover:bg-white/10 sm:hidden"
                onClick={() => toggleSidebar()}
              >
                <Menu className="h-5 w-5" />
              </button>
            ) : null}
            <h1 className="truncate pr-2 text-base font-semibold text-white">{lesson.title}</h1>
          </div>
          {allLessonsDone ? (
            <button
              type="button"
              onClick={() => void onCompleteCourse()}
              className="shrink-0 rounded-md bg-[#058E61] px-3 py-2 text-sm font-medium text-white transition-colors hover:opacity-95 sm:px-4"
            >
              Complete this Course
            </button>
          ) : null}
        </header>

        {lesson.description?.trim() ? (
          <div className="mx-4 mt-4 border-l-[3px] border-[#3B82F6] bg-white/5 px-4 py-3 text-sm leading-relaxed text-slate-300 sm:mx-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Description</p>
            <p className="mt-1 whitespace-pre-wrap">{lesson.description}</p>
          </div>
        ) : (
          <div className="mx-4 mt-4 rounded-lg border border-dashed border-white/15 bg-white/5 px-4 py-3 text-xs text-zinc-500 sm:mx-6">
            <span className="font-semibold text-zinc-400">Description </span>
            <span className="italic">No description added for this content.</span>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
          <LessonViewer lesson={lesson} onQuizComplete={onQuizComplete} />
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-white/10 bg-[#0f172a]/95 px-4 py-4 sm:px-6">
          {allLessonsDone ? (
            <button
              type="button"
              onClick={() => void onCompleteCourse()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#9333EA] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#7C3AED]"
            >
              Finish the course
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isLastLesson}
              onClick={() => void onNextContent()}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors",
                isLastLesson
                  ? "cursor-not-allowed bg-slate-600 opacity-50"
                  : "bg-[#3B82F6] hover:bg-[#2563EB]",
              )}
            >
              Next Content
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </footer>
      </div>

      {celebration ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-complete-title"
        >
          <div className="w-full max-w-[480px] rounded-2xl bg-white p-8 text-center shadow-2xl sm:p-10">
            {certificateOpen ? (
              <CompletionCertificate
                learnerName={authUser?.full_name?.trim() || "Learner"}
                courseTitle={celebration.title}
                completedAtIso={celebration.completionDate}
                onBack={() => setCertificateOpen(false)}
              />
            ) : (
              <>
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
                    onClick={() => setCertificateOpen(true)}
                    className="h-11 w-full rounded-lg border border-primary bg-primary-light text-sm font-semibold text-primary hover:bg-primary-light/80"
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
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LessonViewer({
  lesson,
  onQuizComplete,
}: {
  lesson: LessonItem;
  onQuizComplete: (result: SubmitResult, completedAtIso: string) => void;
}) {
  if (lesson.type === "video") {
    return <VideoLessonView lesson={lesson} />;
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
        <img src={lesson.file_url} alt={lesson.title} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  if (lesson.type === "quiz") {
    return quizIdForLesson(lesson) ? (
      <QuizPlayer quizId={quizIdForLesson(lesson)!} onQuizComplete={onQuizComplete} />
    ) : (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/20 p-8 text-sm text-slate-400">
        No quiz linked to this lesson.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-white/20 p-8 text-center text-slate-400">
      <p className="text-sm">Unsupported lesson type.</p>
    </div>
  );
}

function quizIdForLesson(lesson: LessonItem): string | null {
  return lesson.quiz_id ?? lesson.id ?? null;
}

function VideoLessonView({ lesson }: { lesson: LessonItem }) {
  const [played, setPlayed] = useState(0);
  const [dur, setDur] = useState(0);

  if (!lesson.video_url) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/20 p-8 text-sm text-slate-400">
        No video URL configured for this lesson.
      </div>
    );
  }

  const start = getVideoStartSeconds(lesson.video_url);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-black/40">
      <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-md bg-black/75 px-3 py-1.5 text-xs font-medium tabular-nums text-white shadow-lg">
        {formatPlaybackClock(played)} / {dur > 0 ? formatPlaybackClock(dur) : "—"}
        {start != null && start > 0 ? (
          <span className="ml-2 text-zinc-400">· starts at {formatPlaybackClock(start)}</span>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div className="aspect-video w-full max-h-full max-w-[1200px]">
          <ReactPlayer
            url={lesson.video_url}
            controls
            width="100%"
            height="100%"
            progressInterval={500}
            onProgress={(e) => setPlayed(e.playedSeconds)}
            onDuration={(d) => setDur(d)}
            config={{
              youtube: {
                playerVars: start != null && start > 0 ? { start } : {},
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
