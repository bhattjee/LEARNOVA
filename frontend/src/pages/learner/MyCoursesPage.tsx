import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import * as authService from "@/services/authService";
import { Skeleton } from "@/components/ui/Skeleton";
import { LearnerNavbar } from "@/components/common/LearnerNavbar";
import { LearnerCourseCard } from "@/components/learner/CourseCard";
import { PaidCourseCheckoutModal } from "@/components/learner/PaidCourseCheckoutModal";
import { ProfilePanel } from "@/components/learner/ProfilePanel";
import { MOCK_LEARNER_COURSES } from "@/constants/mockShowcaseCourses";
import { useMyCourses } from "@/hooks/useLearnerCatalog";
import { useAuthStore } from "@/stores/authStore";
import type { LearnerCourseItem } from "@/types/course.types";

function filterCourses(list: LearnerCourseItem[], q: string): LearnerCourseItem[] {
  const query = q.trim().toLowerCase();
  if (!query) {
    return list;
  }
  return list.filter(
    (c) =>
      c.title.toLowerCase().includes(query) ||
      c.tags.some((t) => t.toLowerCase().includes(query)) ||
      (c.description_short?.toLowerCase().includes(query) ?? false),
  );
}

export function MyCoursesPage() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [checkout, setCheckout] = useState<{
    id: string;
    title: string;
    priceCents: number | null;
  } | null>(null);
  const { data, isLoading, isError } = useMyCourses();

  const apiCourses = data?.data ?? [];
  const showMock = apiCourses.length === 0 && !isLoading && !isError;

  const sourceList: LearnerCourseItem[] = showMock ? MOCK_LEARNER_COURSES : apiCourses;
  const filtered = useMemo(() => filterCourses(sourceList, search), [sourceList, search]);

  const averageCourseCompletionPct = useMemo(() => {
    const list = showMock ? MOCK_LEARNER_COURSES : apiCourses;
    if (list.length === 0) {
      return null;
    }
    const sum = list.reduce((a, c) => a + (c.completion_percentage ?? 0), 0);
    return sum / list.length;
  }, [apiCourses, showMock]);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (!token) {
      return;
    }
    void authService
      .getMe()
      .then((u) => useAuthStore.getState().setUser(u))
      .catch(() => {
        /* keep cached user */
      });
  }, []);

  const empty = !isLoading && !isError && filtered.length === 0;

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <LearnerNavbar />

      <div className="border-b border-brand-mid-grey/80 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:gap-8">
          <h1 className="shrink-0 text-2xl font-extrabold tracking-tight text-brand-black sm:text-[26px]">
            My Courses
          </h1>
          <div className="flex min-h-12 w-full flex-1 items-center gap-3 rounded-2xl border border-brand-mid-grey bg-brand-light-grey/80 px-4 shadow-inner">
            <Search className="h-5 w-5 shrink-0 text-brand-dark-grey" aria-hidden />
            <label htmlFor="my-courses-search" className="sr-only">
              Search my courses
            </label>
            <input
              id="my-courses-search"
              type="search"
              placeholder="Search course…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 w-full border-0 bg-transparent text-sm text-brand-black outline-none placeholder:text-brand-dark-grey"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
          <section className="min-w-0 flex-1">
            {showMock ? (
              <div className="mb-6 rounded-xl border border-dashed border-primary/30 bg-primary-light/60 px-4 py-3 text-sm text-brand-dark-grey">
                <span className="font-semibold text-primary">Preview</span> — example courses with the same
                titles used in instructor and admin views.{" "}
                <Link to="/courses" className="font-semibold text-primary underline-offset-2 hover:underline">
                  Browse the catalog
                </Link>{" "}
                to enroll for real.
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-brand-mid-grey/80 bg-white p-4 shadow-sm"
                  >
                    <Skeleton className="aspect-[16/10] w-full rounded-xl" />
                    <Skeleton className="mt-4 h-6 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                    <div className="mt-6 flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full max-w-[140px] rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {isError ? (
              <p className="text-sm text-status-danger" role="alert">
                Could not load your courses.
              </p>
            ) : null}

            {empty ? (
              <div className="flex flex-col items-center rounded-2xl border border-brand-mid-grey bg-white py-16 text-center shadow-sm">
                <h3 className="text-lg font-bold text-brand-black">No results</h3>
                <p className="mt-1 max-w-[320px] text-sm text-brand-dark-grey">
                  No courses match &quot;{search}&quot;. Try another keyword.
                </p>
              </div>
            ) : null}

            {!isLoading && !isError && filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c) => (
                  <LearnerCourseCard
                    key={c.id}
                    course={c}
                    isAuthenticated
                    showcaseDestination={showMock ? "/courses" : undefined}
                    onPaidCheckout={
                      showMock
                        ? undefined
                        : (course) =>
                            setCheckout({
                              id: course.id,
                              title: course.title,
                              priceCents: course.price_cents ?? null,
                            })
                    }
                  />
                ))}
              </div>
            ) : null}
          </section>

          <div className="w-full shrink-0 lg:sticky lg:top-24 lg:max-w-[300px]">
            <ProfilePanel
              user={user}
              isLoading={!user}
              averageCourseCompletionPct={averageCourseCompletionPct}
            />
          </div>
        </div>
      </div>

      <PaidCourseCheckoutModal
        open={checkout !== null}
        onOpenChange={(o) => {
          if (!o) {
            setCheckout(null);
          }
        }}
        courseId={checkout?.id ?? null}
        courseTitle={checkout?.title ?? ""}
        priceCents={checkout?.priceCents ?? null}
      />
    </div>
  );
}
