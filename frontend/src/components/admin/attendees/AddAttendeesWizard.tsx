import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useAddCourseAttendees } from "@/hooks/useCourses";

interface AddAttendeesWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
}

/** Same shape as backend: basic user@domain.tld check */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function classifyEmails(raw: string): { valid: string[]; invalid: string[] } {
  const parts = raw.split(/[\s,;]+/);
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const p of parts) {
    const t = p.trim();
    if (!t) continue;
    const e = t.toLowerCase();
    if (seen.has(e)) continue;
    seen.add(e);
    if (EMAIL_RE.test(e)) {
      valid.push(e);
    } else {
      invalid.push(t);
    }
  }
  return { valid, invalid };
}

export function AddAttendeesWizard({ open, onOpenChange, courseId }: AddAttendeesWizardProps) {
  const addAttendees = useAddCourseAttendees(courseId);
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<string[]>([]);
  const [done, setDone] = useState<{ added: number; already: number; queued: number } | null>(null);
  const [invalidEmails, setInvalidEmails] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setRawText("");
    setPreview([]);
    setDone(null);
    setInvalidEmails([]);
  }, [open]);

  function reset() {
    setStep(1);
    setRawText("");
    setPreview([]);
    setDone(null);
    setInvalidEmails([]);
  }

  function handleClose(next: boolean) {
    if (!next && addAttendees.isPending) return;
    if (!next) reset();
    onOpenChange(next);
  }

  function handlePreview() {
    const { valid, invalid } = classifyEmails(rawText);
    setInvalidEmails(invalid);
    if (invalid.length > 0) {
      toast.error("Fix invalid email addresses before continuing.");
      return;
    }
    if (valid.length === 0) {
      toast.error("Enter at least one valid email address.");
      return;
    }
    setPreview(valid);
    setStep(2);
  }

  async function handleAdd() {
    if (preview.length === 0) return;
    try {
      const res = await addAttendees.mutateAsync(preview);
      setDone({ added: res.added, already: res.already_enrolled, queued: res.emails_queued });
      toast.success(
        `${res.added} learner${res.added === 1 ? "" : "s"} added, invitation emails queued` +
          (res.already_enrolled > 0 ? ` (${res.already_enrolled} already enrolled).` : "."),
      );
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(typeof msg === "string" ? msg : "Could not add attendees.");
    }
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[55] bg-black/40"
        aria-label="Close"
        onClick={() => handleClose(false)}
      />
      <div className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[480px] flex-col border-l border-brand-mid-grey bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-brand-mid-grey px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-black">Add Attendees</h2>
          <button
            type="button"
            disabled={addAttendees.isPending}
            onClick={() => handleClose(false)}
            className="rounded p-1 text-brand-dark-grey hover:bg-brand-light-grey"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {done ? (
            <div className="space-y-2 text-sm text-brand-dark-grey">
              <p className="font-medium text-brand-black">All set</p>
              <p>
                {done.added} learner{done.added === 1 ? "" : "s"} added, invitation emails queued.
              </p>
              {done.already > 0 ? (
                <p>{done.already} address{done.already === 1 ? " was" : "es were"} already enrolled.</p>
              ) : null}
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-brand-dark-grey">Step 1 — Email entry</p>
              <label htmlFor="add-attendees-textarea" className="sr-only">
                Email addresses
              </label>
              <textarea
                id="add-attendees-textarea"
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setInvalidEmails([]);
                }}
                rows={12}
                placeholder="Enter email addresses, one per line"
                className="w-full resize-y rounded-md border border-brand-mid-grey px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2"
              />
              {invalidEmails.length > 0 ? (
                <div className="rounded-md border border-status-danger/40 bg-status-danger/5 p-3 text-sm text-status-danger" role="alert">
                  <p className="font-medium">Invalid email format</p>
                  <ul className="mt-1 list-inside list-disc">
                    {invalidEmails.map((x: string) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handlePreview}
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-brand-mid-grey bg-white px-4 text-sm font-medium text-brand-black hover:bg-brand-light-grey"
              >
                Preview
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-brand-dark-grey">Step 2 — Confirmation</p>
              <p className="text-sm text-brand-black">These addresses will be invited:</p>
              <ul className="flex max-h-[40vh] flex-wrap gap-2 overflow-y-auto">
                {preview.map((e) => (
                  <li
                    key={e}
                    className="rounded-full bg-brand-light-grey px-3 py-1 text-xs font-medium text-brand-black"
                  >
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-brand-mid-grey p-6">
          {done ? (
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Done
            </button>
          ) : step === 2 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                disabled={addAttendees.isPending}
                onClick={() => setStep(1)}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-brand-mid-grey bg-white px-4 text-sm font-medium text-brand-dark-grey hover:bg-brand-light-grey disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                disabled={addAttendees.isPending}
                onClick={() => void handleAdd()}
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60 sm:max-w-[240px] sm:flex-none"
              >
                {addAttendees.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add & Invite"
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
