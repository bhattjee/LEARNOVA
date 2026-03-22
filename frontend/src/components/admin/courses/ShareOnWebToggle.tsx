import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { CourseVisibility } from "@/types/course.types";

interface ShareOnWebToggleProps {
  /** When `everyone`, the course is discoverable without sign-in (catalog); `signed_in` limits discovery to logged-in users. */
  visibility: CourseVisibility;
  disabled?: boolean;
  onChange: (next: CourseVisibility) => void | Promise<void>;
}

export function ShareOnWebToggle({ visibility, disabled, onChange }: ShareOnWebToggleProps) {
  const [optimistic, setOptimistic] = useState(visibility === "everyone");

  useEffect(() => {
    setOptimistic(visibility === "everyone");
  }, [visibility]);

  async function handleClick() {
    if (disabled) return;
    const nextEveryone = !optimistic;
    const nextVisibility: CourseVisibility = nextEveryone ? "everyone" : "signed_in";
    const prev = optimistic;
    setOptimistic(nextEveryone);
    try {
      await Promise.resolve(onChange(nextVisibility));
    } catch {
      setOptimistic(prev);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark-grey">
        Share on web
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        disabled={disabled}
        onClick={() => void handleClick()}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-light",
          optimistic ? "bg-status-success" : "bg-brand-mid-grey",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-[left]",
            optimistic ? "left-7" : "left-1",
          )}
        />
      </button>
    </div>
  );
}
