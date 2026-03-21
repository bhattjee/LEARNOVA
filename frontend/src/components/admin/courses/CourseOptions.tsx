import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCourse, useStaffUsers, useUpdateCourseOptions } from "@/hooks/useCourses";
import type { CourseAccessRule, CourseVisibility } from "@/types/course.types";

interface CourseOptionsProps {
  courseId: string;
}

function RadioRow({
  name,
  checked,
  onChange,
  title,
  description,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
        checked ? "border-primary bg-primary/5" : "border-brand-mid-grey hover:bg-brand-light-grey/80",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 shrink-0 border-brand-mid-grey text-primary focus:ring-primary"
      />
      <span>
        <span className="block text-sm font-medium text-brand-black">{title}</span>
        <span className="mt-0.5 block text-xs text-brand-dark-grey">{description}</span>
      </span>
    </label>
  );
}

export function CourseOptions({ courseId }: CourseOptionsProps) {
  const { data: course, isLoading, isError } = useCourse(courseId);
  const { data: staffUsers, isLoading: staffLoading } = useStaffUsers();
  const updateOptions = useUpdateCourseOptions(courseId);

  const [visibility, setVisibility] = useState<CourseVisibility>("everyone");
  const [accessRule, setAccessRule] = useState<CourseAccessRule>("open");
  const [priceMajor, setPriceMajor] = useState<string>("0");
  const [responsibleId, setResponsibleId] = useState("");

  useEffect(() => {
    if (!course) return;
    setVisibility(course.visibility);
    setAccessRule(course.access_rule);
    const cents = course.price_cents ?? 0;
    setPriceMajor((cents / 100).toFixed(2));
    setResponsibleId(course.responsible_user_id ?? "");
  }, [course]);

  async function saveOptions() {
    if (!course) return;
    let price_cents: number | null = null;
    if (accessRule === "on_payment") {
      const priceNum = Number.parseFloat(priceMajor.replace(",", "."));
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        toast.error("Enter a price greater than zero for paid courses.");
        return;
      }
      price_cents = Math.round(priceNum * 100);
    }
    try {
      await updateOptions.mutateAsync({
        visibility,
        access_rule: accessRule,
        price_cents,
        responsible_user_id: responsibleId === "" ? null : responsibleId,
      });
      toast.success("Options saved");
    } catch (e: unknown) {
      const detail =
        typeof e === "object" && e !== null && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(typeof detail === "string" ? detail : "Could not save options.");
    }
  }

  if (isLoading || !course) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-brand-mid-grey bg-white p-6">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark-grey" aria-hidden />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-xl border border-brand-mid-grey bg-white p-6 text-sm text-status-danger">
        Could not load course options.
      </p>
    );
  }

  const saving = updateOptions.isPending;

  return (
    <div className="rounded-xl border border-brand-mid-grey bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <section className="mb-8">
        <h3 className="text-base font-semibold text-brand-black">Visibility</h3>
        <p className="mt-1 text-sm text-brand-dark-grey">Controls who can see this course on the website</p>
        <div className="mt-4 space-y-2">
          <RadioRow
            name="visibility"
            checked={visibility === "everyone"}
            onChange={() => setVisibility("everyone")}
            title="Everyone"
            description="Visible to all visitors, even without login"
          />
          <RadioRow
            name="visibility"
            checked={visibility === "signed_in"}
            onChange={() => setVisibility("signed_in")}
            title="Signed In"
            description="Only visible to logged-in users"
          />
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-base font-semibold text-brand-black">Access Rule</h3>
        <p className="mt-1 text-sm text-brand-dark-grey">Controls who can enroll and start learning</p>
        <div className="mt-4 space-y-2">
          <RadioRow
            name="access"
            checked={accessRule === "open"}
            onChange={() => setAccessRule("open")}
            title="Open"
            description="Anyone who sees the course can start it"
          />
          <RadioRow
            name="access"
            checked={accessRule === "on_invitation"}
            onChange={() => setAccessRule("on_invitation")}
            title="On Invitation"
            description="Only invited/enrolled users can access lessons"
          />
          <RadioRow
            name="access"
            checked={accessRule === "on_payment"}
            onChange={() => setAccessRule("on_payment")}
            title="On Payment"
            description="Learners must purchase to access"
          />
        </div>
        {accessRule === "on_payment" ? (
          <div className="mt-4">
            <label htmlFor="course-price-major" className="mb-1 block text-sm font-medium text-brand-black">
              Price (₹ / $)
            </label>
            <input
              id="course-price-major"
              type="number"
              min={0}
              step="0.01"
              value={priceMajor}
              onChange={(e) => setPriceMajor(e.target.value)}
              className="h-10 max-w-xs rounded-md border border-brand-mid-grey px-3 text-sm outline-none focus:border-primary focus:ring-2"
            />
          </div>
        ) : null}
      </section>

      <section className="mb-8">
        <h3 className="text-base font-semibold text-brand-black">Course Admin</h3>
        <label htmlFor="options-responsible" className="mt-3 mb-1 block text-sm font-medium text-brand-black">
          Responsible Person
        </label>
        <select
          id="options-responsible"
          value={responsibleId}
          onChange={(e) => setResponsibleId(e.target.value)}
          disabled={staffLoading}
          className="h-10 w-full max-w-md rounded-md border border-brand-mid-grey bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2"
        >
          <option value="">None</option>
          {(staffUsers ?? []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.role})
            </option>
          ))}
        </select>
      </section>

      <div className="flex justify-end border-t border-brand-mid-grey pt-6">
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveOptions()}
          className="inline-flex min-h-9 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Options"}
        </button>
      </div>
    </div>
  );
}
