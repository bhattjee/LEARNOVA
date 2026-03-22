import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { LearnerNavbar } from "@/components/common/LearnerNavbar";
import { LearnerCourseCard } from "@/components/learner/CourseCard";
import { PaidCourseCheckoutModal } from "@/components/learner/PaidCourseCheckoutModal";
import { usePublicCourses } from "@/hooks/useLearnerCatalog";
import { useAuthStore } from "@/stores/authStore";
import type { PublicCourseItem } from "@/types/course.types";

export function CourseCatalogPage() {
  const [search, setSearch] = useState("");
  const [checkout, setCheckout] = useState<{
    id: string;
    title: string;
    priceCents: number | null;
  } | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError } = usePublicCourses(search);

  const courses = data?.data ?? [];

  const empty = useMemo(() => !isLoading && !isError && courses.length === 0, [courses.length, isError, isLoading]);

  return (
    <div className="min-h-screen bg-brand-light-grey">
      <LearnerNavbar />
      <main className="mx-auto max-w-[1200px] px-6 pb-16 pt-10">
        <header className="text-center">
          <h1 className="text-[28px] font-bold text-brand-black">Explore Courses</h1>
          <p className="mt-2 text-brand-dark-grey">Find your next skill</p>
        </header>

        <div className="mx-auto mt-8 flex max-w-[560px] items-center gap-2 rounded-lg border border-brand-mid-grey bg-white px-3 shadow-sm">
          <Search className="h-5 w-5 shrink-0 text-brand-dark-grey" aria-hidden />
          <label htmlFor="catalog-search" className="sr-only">
            Search courses
          </label>
          <input
            id="catalog-search"
            type="search"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full border-0 bg-transparent text-sm text-brand-black outline-none placeholder:text-brand-dark-grey"
          />
        </div>

        {isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-brand-mid-grey bg-white p-4 shadow-sm">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="mt-4 h-6 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
                <div className="mt-6 flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {isError ? (
          <p className="mt-12 text-center text-sm text-status-danger" role="alert">
            Could not load courses. Please try again later.
          </p>
        ) : null}

        {empty ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-mid-grey/10 text-brand-dark-grey/40">
              <BookOpen className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-bold text-brand-black">No courses found</h3>
            <p className="mt-1 text-sm text-brand-dark-grey max-w-[320px]">
              {search 
                ? `We couldn't find any courses matching "${search}". Try a different keyword.`
                : "There are no public courses available yet. Check back later!"}
            </p>
          </div>
        ) : null}

        {!isLoading && !isError && courses.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <LearnerCourseCard
                key={c.id}
                course={c}
                isAuthenticated={isAuthenticated}
                onPaidCheckout={
                  isAuthenticated
                    ? (course: PublicCourseItem) =>
                        setCheckout({
                          id: course.id,
                          title: course.title,
                          priceCents: course.price_cents ?? null,
                        })
                    : undefined
                }
              />
            ))}
          </div>
        ) : null}
      </main>

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
