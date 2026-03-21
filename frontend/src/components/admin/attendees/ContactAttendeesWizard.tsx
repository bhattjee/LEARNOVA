import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useContactCourseAttendees, useCourseAttendees } from "@/hooks/useCourses";

interface ContactAttendeesWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
}

export function ContactAttendeesWizard({ open, onOpenChange, courseId }: ContactAttendeesWizardProps) {
  const { data: attendees, isLoading } = useCourseAttendees(courseId, open);
  const contact = useContactCourseAttendees(courseId);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setSubject("");
    setBody("");
    setSent(null);
  }, [open]);

  function reset() {
    setSubject("");
    setBody("");
    setSent(null);
  }

  function handleClose(next: boolean) {
    if (!next && contact.isPending) return;
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSend() {
    const s = subject.trim();
    const b = body.trim();
    if (!s || !b) {
      toast.error("Subject and message are required.");
      return;
    }
    try {
      const res = await contact.mutateAsync({ subject: s, body: b });
      setSent(res.queued);
      toast.success(`Message queued for ${res.queued} learner${res.queued === 1 ? "" : "s"}.`);
    } catch {
      toast.error("Could not queue message.");
    }
  }

  if (!open) {
    return null;
  }

  const count = attendees?.length ?? 0;
  const canSend = subject.trim().length > 0 && body.trim().length > 0;

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
          <h2 className="text-lg font-semibold text-brand-black">Contact Attendees</h2>
          <button
            type="button"
            disabled={contact.isPending}
            onClick={() => handleClose(false)}
            className="rounded p-1 text-brand-dark-grey hover:bg-brand-light-grey"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {sent !== null ? (
            <p className="text-sm text-brand-dark-grey">
              Message queued for {sent} enrolled learner{sent === 1 ? "" : "s"}.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-brand-dark-grey">
                {isLoading ? (
                  "Loading…"
                ) : (
                  <>
                    Sending to <strong className="text-brand-black">{count}</strong> enrolled learner
                    {count === 1 ? "" : "s"}
                  </>
                )}
              </p>
              <div>
                <label htmlFor="contact-subject" className="mb-1 block text-sm font-medium text-brand-black">
                  Subject <span className="text-status-danger">*</span>
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={500}
                  className="h-10 w-full rounded-md border border-brand-mid-grey px-3 text-sm outline-none focus:border-primary focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="contact-body" className="mb-1 block text-sm font-medium text-brand-black">
                  Message <span className="text-status-danger">*</span>
                </label>
                <textarea
                  id="contact-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  maxLength={20000}
                  placeholder="Write your message…"
                  className="w-full resize-y rounded-md border border-brand-mid-grey px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2"
                />
                <p className="mt-1 text-xs text-brand-dark-grey">{body.length} / 20000</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-brand-mid-grey p-6">
          {sent !== null ? (
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSend || contact.isPending || isLoading}
              onClick={() => void handleSend()}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {contact.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Message"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
