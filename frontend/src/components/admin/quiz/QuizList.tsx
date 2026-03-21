import { useState } from "react";
import { Loader2, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuizMutations, useQuizzes } from "@/hooks/useQuizzes";
import type { QuizItem } from "@/types/quiz.types";

interface QuizListProps {
  courseId: string;
}

function QuizRow({
  quiz,
  onDeleteRequest,
  onEdit,
}: {
  quiz: QuizItem;
  onDeleteRequest: () => void;
  onEdit: () => void;
}) {
  const n = quiz.question_count;
  const label = n === 1 ? "1 question" : `${n} questions`;

  return (
    <div className="flex items-center gap-3 border-b border-brand-mid-grey py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-brand-black">{quiz.title}</p>
        <p className="text-xs text-brand-dark-grey">{label}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-brand-dark-grey hover:bg-brand-light-grey"
            aria-label="Quiz actions"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem
            className="text-status-danger focus:text-status-danger"
            onClick={onDeleteRequest}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function QuizList({ courseId }: QuizListProps) {
  const navigate = useNavigate();
  const { data: quizzes, isLoading, isError } = useQuizzes(courseId);
  const { create, remove } = useQuizMutations(courseId);

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleCreate() {
    const t = newTitle.trim();
    if (!t) {
      toast.error("Title is required.");
      return;
    }
    setCreating(true);
    try {
      const q = await create.mutateAsync({ title: t });
      setCreateOpen(false);
      setNewTitle("");
      navigate(`/admin/courses/${courseId}/quiz/${q.id}`);
    } catch {
      toast.error("Could not create quiz.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand-mid-grey bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-brand-black">Quizzes</h3>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex min-h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Add Quiz
        </button>
      </div>

      {isError ? (
        <p className="text-sm text-status-danger" role="alert">
          Could not load quizzes.
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-dark-grey" aria-hidden />
        </div>
      ) : null}

      {!isLoading && !isError && (quizzes?.length ?? 0) === 0 ? (
        <p className="rounded-lg border border-dashed border-brand-mid-grey bg-brand-light-grey px-4 py-8 text-center text-sm text-brand-dark-grey">
          No quizzes yet
        </p>
      ) : null}

      {!isLoading && quizzes && quizzes.length > 0 ? (
        <div>
          {quizzes.map((q) => (
            <QuizRow
              key={q.id}
              quiz={q}
              onEdit={() => navigate(`/admin/courses/${courseId}/quiz/${q.id}`)}
              onDeleteRequest={() => setDeleteId(q.id)}
            />
          ))}
        </div>
      ) : null}

      <Dialog open={createOpen} onOpenChange={(o) => !creating && setCreateOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New quiz</DialogTitle>
          </DialogHeader>
          <label className="block text-sm font-medium text-brand-black" htmlFor="new-quiz-title">
            Title
          </label>
          <input
            id="new-quiz-title"
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-brand-mid-grey px-3 text-sm outline-none focus:border-primary focus:ring-2"
            placeholder="Quiz title"
          />
          <DialogFooter>
            <button
              type="button"
              disabled={creating}
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-brand-mid-grey bg-white px-4 text-sm font-medium text-brand-dark-grey hover:bg-brand-light-grey disabled:opacity-60"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={creating}
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              onClick={() => void handleCreate()}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete quiz?"
        description="This quiz will be removed from the course. Learners will no longer see it."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          if (!deleteId) return;
          await remove.mutateAsync(deleteId);
          toast.success("Quiz deleted");
        }}
      />
    </div>
  );
}
