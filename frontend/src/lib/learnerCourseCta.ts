import type { CourseAccessRule, LearnerCourseStatus } from "@/types/course.types";

export type LearnerCta =
  | { kind: "link"; to: string; label: string; className: string }
  | { kind: "button"; label: string; className: string; disabled?: boolean };

export function formatInr(priceCents: number): string {
  const rupees = priceCents / 100;
  return rupees % 1 === 0 ? String(Math.round(rupees)) : rupees.toFixed(2);
}

export function resolveLearnerCourseCta(params: {
  isAuthenticated: boolean;
  learnerStatus: LearnerCourseStatus | null;
  accessRule: CourseAccessRule;
  priceCents: number | null;
}): LearnerCta {
  const { isAuthenticated, learnerStatus, accessRule, priceCents } = params;

  if (!isAuthenticated) {
    return {
      kind: "link",
      to: "/login",
      label: "Join Course",
      className:
        "inline-flex h-10 min-w-[140px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover",
    };
  }

  const status = learnerStatus;
  if (!status || status === "not_enrolled") {
    if (accessRule === "on_invitation") {
      return {
        kind: "button",
        label: "By Invitation Only",
        className:
          "inline-flex h-10 min-w-[140px] cursor-not-allowed items-center justify-center rounded-md bg-brand-light-grey px-4 text-sm font-medium text-brand-dark-grey",
        disabled: true,
      };
    }
    if (accessRule === "on_payment") {
      const price = priceCents != null ? formatInr(priceCents) : "—";
      return {
        kind: "button",
        label: `Buy Course — ₹${price}`,
        className:
          "inline-flex h-10 min-w-[140px] items-center justify-center rounded-md bg-status-warning px-4 text-sm font-medium text-white hover:opacity-95",
      };
    }
    return {
      kind: "button",
      label: "Start Learning",
      className:
        "inline-flex h-10 min-w-[140px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover",
    };
  }

  if (status === "enrolled") {
    return {
      kind: "button",
      label: "Start",
      className:
        "inline-flex h-10 min-w-[140px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover",
    };
  }
  if (status === "in_progress") {
    return {
      kind: "button",
      label: "Continue",
      className:
        "inline-flex h-10 min-w-[140px] items-center justify-center rounded-md border-2 border-primary bg-white px-4 text-sm font-medium text-primary hover:bg-primary-light",
    };
  }
  return {
    kind: "button",
    label: "Completed ✓",
    className:
      "inline-flex h-10 min-w-[140px] cursor-not-allowed items-center justify-center rounded-md border border-status-success/40 bg-[#ECFDF5] px-4 text-sm font-medium text-status-success",
    disabled: true,
  };
}
