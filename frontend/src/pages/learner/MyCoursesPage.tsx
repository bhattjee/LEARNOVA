import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { LearnerNavbar } from "@/components/common/LearnerNavbar";
import { LearnerCourseCard } from "@/components/learner/CourseCard";
import { ProfilePanel } from "@/components/learner/ProfilePanel";
import { useMyCourses } from "@/hooks/useLearnerCatalog";
import { useAuthStore } from "@/stores/authStore";

export function MyCoursesPage() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useMyCourses();

  const courses = data?.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return courses;
    }
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        (c.description_short?.toLowerCase().includes(q) ?? false),
    );
  }, [courses, search]);

  const empty = !isLoading && !isError && filtered.length === 0;

  return (
    <div className="min-h-screen bg-brand-light-grey">
      <LearnerNavbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <section className="order-2 min-w-0 flex-1 lg:order-1">
            <h1 className="text-[28px] font-bold text-brand-black">My Courses</h1>

            <div className="mt-6 flex max-w-[560px] items-center gap-2 rounded-lg border border-brand-mid-grey bg-white px-3 shadow-sm">
              <Search className="h-5 w-5 shrink-0 text-brand-dark-grey" aria-hidden />
              <label htmlFor="my-courses-search" className="sr-only">
                Search my courses
              </label>
              <input
                id="my-courses-search"
                type="search"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full border-0 bg-transparent text-sm text-brand-black outline-none placeholder:text-brand-dark-grey"
              />
            </div>

            {isLoading ? (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, i) => (
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
              <p className="mt-10 text-sm text-status-danger" role="alert">
                Could not load your courses.
              </p>
            ) : null}

            {empty ? (
              <div className="mt-16 flex flex-col items-center text-center">
                <h3 className="text-lg font-bold text-brand-black">
                  {courses.length === 0 ? "Start your journey" : "No results"}
                </h3>
                <p className="mt-1 text-sm text-brand-dark-grey max-w-[280px]">
                  {courses.length === 0
                    ? "You haven't enrolled in any courses yet. Visit the catalog to get started!"
                    : `No courses in your dashboard match "${search}".`}
                </p>
              </div>
            ) : null}

            {!isLoading && !isError && filtered.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c) => (
                  <LearnerCourseCard key={c.id} course={c} isAuthenticated />
                ))}
              </div>
            ) : null}
          </section>

          <div className="order-1 w-full lg:order-2 lg:w-[280px]">
            <ProfilePanel user={user} isLoading={!user} />
          </div>
        </div>
      </div>
    </div>
  );
}
