import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatInr } from "@/lib/learnerCourseCta";
import * as learnerCatalogService from "@/services/learnerCatalogService";
import { LEARNER_DETAIL_KEY, MY_COURSES_KEY } from "@/hooks/useLearnerCatalog";

type Provider = "razorpay" | "paypal";

interface PaidCourseCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string | null;
  courseTitle: string;
  priceCents: number | null;
}

export function PaidCourseCheckoutModal({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  priceCents,
}: PaidCourseCheckoutModalProps) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<Provider>("razorpay");
  const [submitting, setSubmitting] = useState(false);

  const amountLabel =
    priceCents != null ? `₹${formatInr(priceCents)}` : "—";

  async function completeDemoPayment() {
    if (!courseId) {
      return;
    }
    setSubmitting(true);
    try {
      await learnerCatalogService.purchaseCourse(courseId);
      await queryClient.invalidateQueries({ queryKey: [MY_COURSES_KEY] });
      await queryClient.invalidateQueries({ queryKey: [LEARNER_DETAIL_KEY] });
      await queryClient.invalidateQueries({ queryKey: ["public-courses"] });
      toast.success("Payment successful — you now have access to this course.");
      onOpenChange(false);
    } catch {
      toast.error("Could not complete purchase. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-2 border-primary/20 bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-brand-black">Checkout (demo)</DialogTitle>
          <DialogDescription className="text-left text-sm text-brand-dark-grey">
            This is a mock payment flow — no real charge. Choose a provider style, then confirm to unlock
            the course.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-brand-mid-grey bg-brand-light-grey/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-dark-grey">Course</p>
          <p className="mt-1 font-semibold text-brand-black">{courseTitle}</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-brand-dark-grey">Amount</p>
              <p className="text-2xl font-bold text-primary">{amountLabel}</p>
            </div>
            <span className="rounded-md bg-status-success/15 px-2 py-1 text-xs font-bold uppercase text-status-success">
              Mock
            </span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-dark-grey">
            Payment method (simulated)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setProvider("razorpay")}
              className={cn(
                "rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition-colors",
                provider === "razorpay"
                  ? "border-status-purple bg-[#F5F0FF] text-status-purple"
                  : "border-brand-mid-grey bg-white text-brand-dark-grey hover:border-brand-mid-grey/80",
              )}
            >
              Razorpay
              <span className="mt-1 block text-[10px] font-normal opacity-80">Mock UI only</span>
            </button>
            <button
              type="button"
              onClick={() => setProvider("paypal")}
              className={cn(
                "rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition-colors",
                provider === "paypal"
                  ? "border-primary bg-primary-light text-primary"
                  : "border-brand-mid-grey bg-white text-brand-dark-grey hover:border-brand-mid-grey/80",
              )}
            >
              PayPal
              <span className="mt-1 block text-[10px] font-normal opacity-80">Mock UI only</span>
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-brand-mid-grey bg-white px-3 py-2 text-center text-xs text-brand-dark-grey">
          {provider === "razorpay" ? (
            <>
              <span className="font-semibold text-status-purple">Razorpay</span> checkout would open here.
              Demo completes instantly.
            </>
          ) : (
            <>
              <span className="font-semibold text-primary">PayPal</span> window would open here. Demo
              completes instantly.
            </>
          )}
        </div>

        <button
          type="button"
          disabled={submitting || !courseId}
          onClick={() => void completeDemoPayment()}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-status-purple text-sm font-semibold text-white shadow-sm transition-colors hover:bg-status-purple/90 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Processing…
            </>
          ) : (
            `Pay ${amountLabel} (demo)`
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
}
