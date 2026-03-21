import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
              <p className="mt-10 text-sm text-brand-dark-grey">Loading your courses…</p>
            ) : null}

            {isError ? (
              <p className="mt-10 text-sm text-status-danger" role="alert">
                Could not load your courses.
              </p>
            ) : null}

            {empty ? (
              <p className="mt-10 text-sm text-brand-dark-grey">
                {courses.length === 0
                  ? "You are not enrolled in any courses yet."
                  : "No courses match your search."}
              </p>
            ) : null}

            {!isLoading && !isError && filtered.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c) => (
                  <LearnerCourseCard key={c.id} course={c} isAuthenticated />
                ))}
              </div>
            ) : null}
          </section>

          {user ? (
            <div className="order-1 w-full lg:order-2 lg:w-[280px]">
              <ProfilePanel user={user} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
