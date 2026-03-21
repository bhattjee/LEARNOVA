import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useToggleCoursePublish } from "@/hooks/useCourses";
import { cn } from "@/lib/utils";

interface PublishToggleProps {
  courseId: string;
  isPublished: boolean;
  website: string | null;
}

export function PublishToggle({ courseId, isPublished, website }: PublishToggleProps) {
  const qc = useQueryClient();
  const mutation = useToggleCoursePublish(courseId);
  const [optimistic, setOptimistic] = useState(isPublished);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    setOptimistic(isPublished);
  }, [isPublished]);

  async function handleClick() {
    setPublishError(null);
    const turningOn = !optimistic;
    if (turningOn && !website?.trim()) {
      setPublishError("Website URL is required before publishing");
      return;
    }
    const previous = optimistic;
    setOptimistic(!previous);
    try {
      await mutation.mutateAsync();
    } catch {
      setOptimistic(previous);
      toast.error("Could not update publish status.");
      void qc.invalidateQueries({ queryKey: ["course", courseId] });
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        disabled={mutation.isPending}
        onClick={() => void handleClick()}
        className={cn(
          "relative inline-flex h-9 min-w-[120px] items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
          optimistic
            ? "bg-status-success text-white hover:opacity-90"
            : "bg-brand-mid-grey text-brand-dark-grey hover:bg-brand-mid-grey/90",
        )}
      >
        {optimistic ? "Published" : "Draft"}
      </button>
      {publishError ? (
        <p className="max-w-[220px] text-right text-xs text-status-danger" role="alert">
          {publishError}
        </p>
      ) : null}
    </div>
  );
}
