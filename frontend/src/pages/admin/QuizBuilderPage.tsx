import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { ArrowLeft, Loader2, Trash2, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuizBuilderMutations, useQuizDetail } from "@/hooks/useQuizzes";
import type { QuizDetail } from "@/types/quiz.types";

interface DraftOption {
  clientId: string;
  text: string;
  is_correct: boolean;
}

interface DraftQuestion {
  clientId: string;
  text: string;
  options: DraftOption[];
}

function newQuestion(): DraftQuestion {
  const a = crypto.randomUUID();
  const b = crypto.randomUUID();
  return {
    clientId: crypto.randomUUID(),
    text: "",
    options: [
      { clientId: a, text: "", is_correct: true },
      { clientId: b, text: "", is_correct: false },
    ],
  };
}

function mapFromApi(detail: QuizDetail): DraftQuestion[] {
  return detail.questions.map((q) => ({
    clientId: crypto.randomUUID(),
    text: q.text,
    options: q.options.map((o) => ({
      clientId: crypto.randomUUID(),
      text: o.text,
      is_correct: o.is_correct,
    })),
  }));
}

function formatApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { detail?: unknown } | undefined;
    if (typeof d?.detail === "string") return d.detail;
    if (Array.isArray(d?.detail)) {
      return d.detail
        .map((x: { msg?: string }) => x.msg ?? JSON.stringify(x))
        .join("; ");
    }
  }
  return "Something went wrong.";
}

export function QuizBuilderPage() {
  const { id: courseId, quizId } = useParams<{ id: string; quizId: string }>();
  const qid = quizId ?? "";
  const cid = courseId ?? "";

  const { data: detail, isLoading, isError } = useQuizDetail(qid, Boolean(qid));
  const { update, saveQuestions } = useQuizBuilderMutations(cid, qid);

  const [title, setTitle] = useState("");
  const [points, setPoints] = useState({
    attempt_1_points: 10,
    attempt_2_points: 7,
    attempt_3_points: 5,
    attempt_4plus_points: 2,
  });
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [rewardsDraft, setRewardsDraft] = useState(points);
  const [optionError, setOptionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [titleSaving, setTitleSaving] = useState(false);
  const [rewardsSaving, setRewardsSaving] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const questionTextRef = useRef<HTMLTextAreaElement>(null);
  const initRef = useRef<string | null>(null);

  useEffect(() => {
    if (!qid || !detail || detail.id !== qid) return;
    if (initRef.current === qid) return;
    initRef.current = qid;
    setTitle(detail.title);
    const p = {
      attempt_1_points: detail.attempt_1_points,
      attempt_2_points: detail.attempt_2_points,
      attempt_3_points: detail.attempt_3_points,
      attempt_4plus_points: detail.attempt_4plus_points,
    };
    setPoints(p);
    setRewardsDraft(p);
    setQuestions(mapFromApi(detail));
    setSelectedIdx(0);
    setOptionError(null);
  }, [qid, detail]);

  useEffect(() => {
    initRef.current = null;
  }, [qid]);

  const safeIdx = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.min(selectedIdx, questions.length - 1);
  }, [questions.length, selectedIdx]);

  useEffect(() => {
    if (questions.length > 0 && selectedIdx > questions.length - 1) {
      setSelectedIdx(questions.length - 1);
    }
  }, [questions.length, selectedIdx]);

  const activeQ = questions[safeIdx];

  function correctCount(q: DraftQuestion | undefined) {
    if (!q) return 0;
    return q.options.filter((o) => o.is_correct).length;
  }

  useEffect(() => {
    if (!activeQ) {
      setOptionError(null);
      return;
    }
    if (correctCount(activeQ) !== 1) {
      setOptionError("Mark one option as correct");
    } else {
      setOptionError(null);
    }
  }, [activeQ]);

  function setCorrect(qIdx: number, optClientId: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIdx
          ? q
          : {
              ...q,
              options: q.options.map((o) => ({ ...o, is_correct: o.clientId === optClientId })),
            },
      ),
    );
  }

  function addOption(qIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || q.options.length >= 8) return q;
        return {
          ...q,
          options: [...q.options, { clientId: crypto.randomUUID(), text: "", is_correct: false }],
        };
      }),
    );
  }

  function removeOption(qIdx: number, optClientId: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || q.options.length <= 2) return q;
        const opts = q.options.filter((o) => o.clientId !== optClientId);
        if (opts.length > 0 && !opts.some((o) => o.is_correct)) {
          const [first, ...rest] = opts;
          return {
            ...q,
            options: [{ ...first!, is_correct: true }, ...rest.map((o) => ({ ...o, is_correct: false }))],
          };
        }
        return { ...q, options: opts };
      }),
    );
  }

  function updateOptionText(qIdx: number, optClientId: string, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIdx
          ? q
          : {
              ...q,
              options: q.options.map((o) => (o.clientId === optClientId ? { ...o, text } : o)),
            },
      ),
    );
  }

  function updateQuestionText(qIdx: number, text: string) {
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, text } : q)));
  }

  function addQuestion() {
    let nextIdx = 0;
    setQuestions((prev) => {
      const next = [...prev, newQuestion()];
      nextIdx = next.length - 1;
      return next;
    });
    setSelectedIdx(nextIdx);
  }

  function openRewards() {
    setRewardsDraft({ ...points });
    setRewardsOpen(true);
  }

  function validateRewardsDraft(): string | null {
    const { attempt_1_points: p1, attempt_2_points: p2, attempt_3_points: p3, attempt_4plus_points: p4 } =
      rewardsDraft;
    if (p1 < 0 || p2 < 0 || p3 < 0 || p4 < 0) return "Points must be non-negative.";
    if (!(p1 >= p2 && p2 >= p3 && p3 >= p4)) {
      return "Each tier must be less than or equal to the previous (1st ≥ 2nd ≥ 3rd ≥ 4th+).";
    }
    return null;
  }

  async function saveRewards() {
    const msg = validateRewardsDraft();
    if (msg) {
      toast.error(msg);
      return;
    }
    setRewardsSaving(true);
    try {
      const updated = await update.mutateAsync({
        attempt_1_points: rewardsDraft.attempt_1_points,
        attempt_2_points: rewardsDraft.attempt_2_points,
        attempt_3_points: rewardsDraft.attempt_3_points,
        attempt_4plus_points: rewardsDraft.attempt_4plus_points,
      });
      setPoints({
        attempt_1_points: updated.attempt_1_points,
        attempt_2_points: updated.attempt_2_points,
        attempt_3_points: updated.attempt_3_points,
        attempt_4plus_points: updated.attempt_4plus_points,
      });
      setRewardsOpen(false);
      toast.success("Rewards saved");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setRewardsSaving(false);
    }
  }

  async function onTitleBlur() {
    const t = title.trim();
    if (!t) {
      toast.error("Title is required.");
      return;
    }
    if (detail && t === detail.title) return;
    setTitleSaving(true);
    try {
      await update.mutateAsync({ title: t });
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setTitleSaving(false);
    }
  }

  function validateDraft(): string | null {
    if (questions.length < 1) return "Add at least one question.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      if (!q.text.trim()) return `Question ${i + 1}: enter question text.`;
      if (q.options.length < 2) return `Question ${i + 1}: add at least 2 options.`;
      const correct = q.options.filter((o) => o.is_correct).length;
      if (correct !== 1) return `Question ${i + 1}: mark exactly one correct option.`;
      for (const o of q.options) {
        if (!o.text.trim()) return `Question ${i + 1}: all options need text.`;
      }
    }
    return null;
  }

  async function handleSaveQuiz() {
    const err = validateDraft();
    if (err) {
      toast.error(err);
      // If it's a question error, focus the question text
      if (err.includes("Question")) {
        questionTextRef.current?.focus();
      }
      return;
    }
    const t = title.trim();
    if (!t) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        questions: questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => ({
            text: o.text.trim(),
            is_correct: o.is_correct,
          })),
        })),
      };
      await saveQuestions.mutateAsync(body);
      const saved = await update.mutateAsync({
        title: t,
        attempt_1_points: points.attempt_1_points,
        attempt_2_points: points.attempt_2_points,
        attempt_3_points: points.attempt_3_points,
        attempt_4plus_points: points.attempt_4plus_points,
      });
      setTitle(saved.title);
      setPoints({
        attempt_1_points: saved.attempt_1_points,
        attempt_2_points: saved.attempt_2_points,
        attempt_3_points: saved.attempt_3_points,
        attempt_4plus_points: saved.attempt_4plus_points,
      });
      setQuestions(mapFromApi(saved));
      setSelectedIdx((i) => Math.min(i, Math.max(0, saved.questions.length - 1)));
      toast.success("Quiz saved!");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  }

  if (!cid || !qid) {
    return <p className="p-6 text-sm text-brand-dark-grey">Missing course or quiz.</p>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-brand-dark-grey" aria-hidden />
      </div>
    );
  }

  if (isError || !detail) {
    return <p className="p-6 text-sm text-status-danger">Could not load quiz.</p>;
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] pb-24">
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-brand-mid-grey pb-4">
        <Link
          to={`/admin/courses/${cid}/edit?tab=quiz`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-brand-dark-grey hover:bg-brand-light-grey"
          aria-label="Back to course"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-xl flex-1">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              onBlur={() => void onTitleBlur()}
              className="h-10 w-full rounded-md border border-brand-mid-grey px-3 text-base font-semibold text-brand-black outline-none focus:border-primary focus:ring-2"
              placeholder="Quiz title"
            />
            {titleSaving ? (
              <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-dark-grey" />
            ) : null}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSaveQuiz()}
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Quiz"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
        <aside className="w-full shrink-0 rounded-xl border border-brand-mid-grey bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:w-[280px]">
          <h3 className="mb-3 text-sm font-semibold text-brand-black">Questions</h3>
          <div className="max-h-[50vh] space-y-1 overflow-y-auto lg:max-h-[calc(100vh-16rem)]">
            {questions.length === 0 ? (
              <p className="text-xs text-brand-dark-grey">No questions yet.</p>
            ) : (
              questions.map((q, idx) => (
                <button
                  key={q.clientId}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={cn(
                    "w-full rounded-md border border-transparent px-2 py-2 text-left text-sm transition-colors",
                    idx === safeIdx
                      ? "border-l-4 border-l-primary bg-brand-light-grey/80 pl-[6px] font-medium text-primary"
                      : "text-brand-black hover:bg-brand-light-grey",
                  )}
                >
                  <span className="block text-xs text-brand-dark-grey">Question {idx + 1}</span>
                  <span className="line-clamp-1">{q.text.trim() || "Untitled"}</span>
                </button>
              ))
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-brand-mid-grey pt-4">
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex min-h-9 w-full items-center justify-center rounded-md border-2 border-primary bg-white px-3 text-sm font-medium text-primary hover:bg-brand-light-grey"
            >
              Add Question
            </button>
            <button
              type="button"
              onClick={openRewards}
              className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-brand-mid-grey bg-white px-3 text-sm font-medium text-brand-dark-grey hover:bg-brand-light-grey"
            >
              Rewards
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 rounded-xl border border-brand-mid-grey bg-white p-6 shadow-sm">
          {!activeQ ? (
            <p className="text-center text-sm text-brand-dark-grey">
              Select a question or add a new one.
            </p>
          ) : (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-brand-dark-grey">Question {safeIdx + 1}</h3>
              <div>
                <label className="sr-only" htmlFor="q-text">
                  Question text
                </label>
                <textarea
                  id="q-text"
                  ref={questionTextRef}
                  value={activeQ.text}
                  onChange={(e) => updateQuestionText(safeIdx, e.target.value)}
                  rows={5}
                  placeholder="Enter your question here..."
                  className="w-full resize-y rounded-md border border-brand-mid-grey px-3 py-2 text-base text-brand-black outline-none focus:border-primary focus:ring-2"
                />
              </div>
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-brand-black">Answer Options</span>
                  <button
                    type="button"
                    onClick={() => addOption(safeIdx)}
                    disabled={activeQ.options.length >= 8}
                    className="text-sm font-medium text-primary hover:underline disabled:opacity-40"
                  >
                    Add Option
                  </button>
                </div>
                {optionError ? <p className="mb-2 text-sm text-status-danger">{optionError}</p> : null}
                <ul className="space-y-2">
                  {activeQ.options.map((o) => (
                    <li
                      key={o.clientId}
                      className="flex items-start gap-2 rounded-md border border-brand-mid-grey p-2"
                    >
                      <input
                        type="radio"
                        name={`correct-${activeQ.clientId}`}
                        checked={o.is_correct}
                        onChange={() => setCorrect(safeIdx, o.clientId)}
                        className="mt-2.5 h-4 w-4 shrink-0 border-brand-mid-grey text-primary focus:ring-primary"
                        aria-label="Mark as correct"
                      />
                      <input
                        type="text"
                        value={o.text}
                        onChange={(e) => updateOptionText(safeIdx, o.clientId, e.target.value)}
                        className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1.5 text-sm outline-none focus:border-primary"
                        placeholder="Option text"
                      />
                      <button
                        type="button"
                        disabled={activeQ.options.length <= 2}
                        onClick={() => removeOption(safeIdx, o.clientId)}
                        className="shrink-0 rounded p-1 text-brand-dark-grey hover:bg-brand-light-grey hover:text-status-danger disabled:opacity-30"
                        aria-label="Remove option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      {rewardsOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/40"
            aria-label="Close rewards"
            onClick={() => !rewardsSaving && setRewardsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[320px] flex-col border-l border-brand-mid-grey bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-mid-grey px-4 py-3">
              <h2 className="text-base font-semibold text-brand-black">Quiz Rewards</h2>
              <button
                type="button"
                disabled={rewardsSaving}
                onClick={() => setRewardsOpen(false)}
                className="rounded p-1 text-brand-dark-grey hover:bg-brand-light-grey"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="mb-4 text-sm text-brand-dark-grey">
                Set points learners earn based on attempt number
              </p>
              <div className="space-y-4">
                <label className="block text-sm">
                  <span className="font-medium text-brand-black">1st attempt</span>
                  <input
                    type="number"
                    min={0}
                    value={rewardsDraft.attempt_1_points}
                    onChange={(e) =>
                      setRewardsDraft((d) => ({ ...d, attempt_1_points: Number(e.target.value) || 0 }))
                    }
                    className="mt-1 h-10 w-full rounded-md border border-brand-mid-grey px-3 text-sm"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-brand-black">2nd attempt</span>
                  <input
                    type="number"
                    min={0}
                    value={rewardsDraft.attempt_2_points}
                    onChange={(e) =>
                      setRewardsDraft((d) => ({ ...d, attempt_2_points: Number(e.target.value) || 0 }))
                    }
                    className="mt-1 h-10 w-full rounded-md border border-brand-mid-grey px-3 text-sm"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-brand-black">3rd attempt</span>
                  <input
                    type="number"
                    min={0}
                    value={rewardsDraft.attempt_3_points}
                    onChange={(e) =>
                      setRewardsDraft((d) => ({ ...d, attempt_3_points: Number(e.target.value) || 0 }))
                    }
                    className="mt-1 h-10 w-full rounded-md border border-brand-mid-grey px-3 text-sm"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-brand-black">4th attempt+</span>
                  <input
                    type="number"
                    min={0}
                    value={rewardsDraft.attempt_4plus_points}
                    onChange={(e) =>
                      setRewardsDraft((d) => ({ ...d, attempt_4plus_points: Number(e.target.value) || 0 }))
                    }
                    className="mt-1 h-10 w-full rounded-md border border-brand-mid-grey px-3 text-sm"
                  />
                </label>
              </div>
            </div>
            <div className="border-t border-brand-mid-grey p-4">
              <button
                type="button"
                disabled={rewardsSaving}
                onClick={() => void saveRewards()}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {rewardsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Rewards"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
