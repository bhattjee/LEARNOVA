import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <p className="text-sm text-brand-dark-grey">{description}</p>
          ) : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            disabled={loading}
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-brand-mid-grey bg-white px-4 text-sm font-medium text-brand-dark-grey hover:bg-brand-light-grey disabled:opacity-60"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            className={cn(
              "inline-flex min-h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-white disabled:opacity-60",
              variant === "danger"
                ? "bg-status-danger hover:opacity-90"
                : "bg-primary hover:bg-primary-hover",
            )}
            onClick={() => void handleConfirm()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
