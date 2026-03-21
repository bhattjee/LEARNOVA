import { useState } from "react";
import {
  BookOpen,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  MoreVertical,
  PlayCircle,
} from "lucide-react";
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
};

function TypeIcon({ type }: { type: LessonType }) {
  const cls = "h-5 w-5 shrink-0 text-brand-dark-grey";
  if (type === "video") return <PlayCircle className={cls} aria-hidden />;
  if (type === "document") return <FileText className={cls} aria-hidden />;
  return <ImageIcon className={cls} aria-hidden />;
}

function LessonRow({
  lesson,
  onEdit,
  onDeleteRequest,
}: {
  lesson: LessonItem;
  onEdit: () => void;
  onDeleteRequest: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-brand-mid-grey py-3 last:border-b-0">
      <div className="flex h-9 w-8 shrink-0 items-center justify-center text-brand-mid-grey" title="Reorder (Phase 16)">
        <GripVertical className="h-5 w-5" aria-hidden />
      </div>
      <TypeIcon type={lesson.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-brand-black">{lesson.title}</p>
      </div>
      <span className="shrink-0 rounded-full bg-brand-light-grey px-2 py-0.5 text-xs text-brand-dark-grey">
        {TYPE_LABEL[lesson.type]}
      </span>
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
    </div>
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
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-dark-grey" aria-label="Loading" />
        </div>
      ) : !lessons?.length ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-brand-mid-grey bg-brand-light-grey px-6 py-14 text-center">
          <BookOpen className="h-14 w-14 text-brand-mid-grey opacity-70" aria-hidden />
          <p className="max-w-sm text-sm text-brand-dark-grey">
            No lessons yet. Click &quot;Add Content&quot; to start.
          </p>
        </div>
      ) : (
        <div>
          {lessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              onEdit={() => openEdit(lesson.id)}
              onDeleteRequest={() => setDeleteId(lesson.id)}
            />
          ))}
        </div>
      )}

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
