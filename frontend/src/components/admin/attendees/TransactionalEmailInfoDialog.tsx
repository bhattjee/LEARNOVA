import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TransactionalEmailInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user chooses to continue to the email flow (add attendees or contact). */
  onContinue: () => void;
}

export function TransactionalEmailInfoDialog({
  open,
  onOpenChange,
  onContinue,
}: TransactionalEmailInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure email (Resend)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-left text-sm text-brand-dark-grey">
          <p>
            Invitations and “Contact attendees” messages are sent with{" "}
            <strong className="text-brand-black">Resend</strong>. If email is not set up, the app still
            saves learners and queues messages, but <strong className="text-brand-black">no email is
            delivered</strong> until the backend is configured.
          </p>
          <ol className="list-decimal space-y-2 pl-4">
            <li>
              Create an API key at{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                resend.com
              </a>{" "}
              and verify your sending domain.
            </li>
            <li>
              In the API <code className="rounded bg-brand-light-grey px-1 py-0.5 text-xs">.env</code>, set{" "}
              <code className="rounded bg-brand-light-grey px-1 py-0.5 text-xs">RESEND_API_KEY</code> and a
              verified{" "}
              <code className="rounded bg-brand-light-grey px-1 py-0.5 text-xs">EMAIL_FROM</code> (e.g.{" "}
              <code className="text-xs">onboarding@yourdomain.com</code>).
            </li>
            <li>Restart the API server so new variables load.</li>
          </ol>
          <p className="text-xs text-brand-dark-grey/90">
            After that, learners receive invitations and messages as expected. Continue to enter
            addresses or compose your message.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-brand-mid-grey bg-white px-4 text-sm font-medium text-brand-dark-grey hover:bg-brand-light-grey"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            onClick={() => {
              onContinue();
              onOpenChange(false);
            }}
          >
            Continue
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
