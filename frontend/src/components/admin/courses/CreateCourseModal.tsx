import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateCourse } from "@/hooks/useCourses";

interface CreateCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCourseModal({ open, onOpenChange }: CreateCourseModalProps) {
  const navigate = useNavigate();
  const createMutation = useCreateCourse();
  const [title, setTitle] = useState("");

  function reset() {
    setTitle("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    try {
      const course = await createMutation.mutateAsync({ title: t });
      reset();
      onOpenChange(false);
      navigate(`/admin/courses/${course.id}/edit`, { replace: true });
    } catch {
      toast.error("Could not create course. Please try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!createMutation.isPending) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label htmlFor="new-course-title" className="sr-only">
              Course Title
            </label>
            <input
              id="new-course-title"
              type="text"
              required
              maxLength={500}
              placeholder="Course Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-md border border-brand-mid-grey bg-white px-3 text-sm text-brand-black outline-none ring-primary-light focus:border-primary focus:ring-2"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-brand-mid-grey bg-white px-4 text-sm font-medium text-brand-dark-grey hover:bg-brand-light-grey"
              disabled={createMutation.isPending}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !title.trim()}
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Creating…
                </>
              ) : (
                "Create Course"
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
