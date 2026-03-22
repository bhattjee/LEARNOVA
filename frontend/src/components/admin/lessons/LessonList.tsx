import { useState } from "react";
import {
  BookOpen,
  FileText,
  HelpCircle,
  ImageIcon,
  MoreVertical,
  PlayCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLessonMutations, useLessons } from "@/hooks/useLessons";
import type { LessonItem, LessonType } from "@/types/lesson.types";
import { LessonEditorModal } from "./LessonEditorModal";

interface LessonListProps {
  courseId: string;
}

const TYPE_LABEL: Record<LessonType, string> = {
  video: "Video",
  document: "Document",
  image: "Image",
  quiz: "Quiz",
};

function TypeIcon({ type }: { type: LessonType }) {
  const cls = "h-5 w-5 shrink-0 text-brand-dark-grey";
  if (type === "video") return <PlayCircle className={cls} aria-hidden />;
  if (type === "document") return <FileText className={cls} aria-hidden />;
  if (type === "quiz") return <HelpCircle className={cls} aria-hidden />;
  return <ImageIcon className={cls} aria-hidden />;
}

function LessonTableRow({
  lesson,
  onEdit,
  onDeleteRequest,
}: {
  lesson: LessonItem;
  onEdit: () => void;
  onDeleteRequest: () => void;
}) {
  return (
    <tr className="border-b border-brand-mid-grey last:border-b-0">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <TypeIcon type={lesson.type} />
          <span className="truncate text-sm font-medium text-brand-black">{lesson.title}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="inline-flex rounded-full bg-brand-light-grey px-2.5 py-0.5 text-xs font-medium text-brand-dark-grey">
          {TYPE_LABEL[lesson.type]}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-brand-dark-grey hover:bg-brand-light-grey"
              aria-label="Lesson actions"
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
      </td>
    </tr>
  );
}

export function LessonList({ courseId }: LessonListProps) {
  const { data: lessons, isLoading, isError } = useLessons(courseId);
  const { remove } = useLessonMutations(courseId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorLessonId, setEditorLessonId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openAdd() {
    setEditorLessonId(null);
    setEditorOpen(true);
  }

  function openEdit(id: string) {
    setEditorLessonId(id);
    setEditorOpen(true);
  }

  return (
    <div className="rounded-xl border border-brand-mid-grey bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-brand-black">Course Content</h3>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex min-h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Add Content
        </button>
      </div>

      {isError ? (
        <p className="text-sm text-status-danger" role="alert">
          Could not load lessons.
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : !lessons?.length ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-brand-mid-grey bg-brand-light-grey px-6 py-14 text-center">
          <BookOpen className="h-14 w-14 text-brand-mid-grey opacity-70" aria-hidden />
          <p className="max-w-sm text-sm text-brand-dark-grey">
            No lessons yet. Use Add Content below to start.
          </p>
        </div>
      ) : (
        <div className="max-h-[min(480px,55vh)] overflow-auto rounded-lg border border-brand-mid-grey">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#F3F4F6]">
              <tr className="text-xs font-semibold uppercase tracking-wide text-brand-dark-grey">
                <th className="px-4 py-3">Content title</th>
                <th className="whitespace-nowrap px-4 py-3">Category</th>
                <th className="w-14 px-4 py-3 text-right" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <LessonTableRow
                  key={lesson.id}
                  lesson={lesson}
                  onEdit={() => openEdit(lesson.id)}
                  onDeleteRequest={() => setDeleteId(lesson.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex justify-center border-t border-brand-mid-grey/80 pt-6">
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex min-h-11 w-full max-w-md items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover sm:text-base"
        >
          Add content
        </button>
      </div>

      <LessonEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        courseId={courseId}
        lessonId={editorLessonId}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(v) => {
          if (!v) setDeleteId(null);
        }}
        title="Delete lesson?"
        description="Are you sure you want to delete this lesson?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await remove.mutateAsync(deleteId);
            toast.success("Lesson deleted");
          } catch {
            toast.error("Could not delete lesson.");
          }
        }}
      />
    </div>
  );
}
