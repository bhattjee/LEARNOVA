import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Called after tags change (add/remove) and when the text input blurs. */
  onCommit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  onCommit,
  disabled,
  placeholder = "Type a tag and press Enter",
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const t = draft.trim();
    if (!t) return;
    if (value.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
    onCommit?.();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((x) => x !== tag));
    onCommit?.();
  }

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap gap-2 rounded-md border border-brand-mid-grey bg-white px-2 py-1.5",
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary"
        >
          {tag}
          <button
            type="button"
            disabled={disabled}
            className="rounded-full p-0.5 hover:bg-primary/10 disabled:opacity-50"
            onClick={() => removeTag(tag)}
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        disabled={disabled}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => onCommit?.()}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none focus:ring-0"
      />
    </div>
  );
}
