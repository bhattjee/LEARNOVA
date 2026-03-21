import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LearnerNavbar } from "@/components/common/LearnerNavbar";
import { LearnerCourseCard } from "@/components/learner/CourseCard";
import { usePublicCourses } from "@/hooks/useLearnerCatalog";
import { useAuthStore } from "@/stores/authStore";

export function CourseCatalogPage() {
  const [search, setSearch] = useState("");
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
          <p className="mt-12 text-center text-sm text-brand-dark-grey">Loading courses…</p>
        ) : null}

        {isError ? (
          <p className="mt-12 text-center text-sm text-status-danger" role="alert">
            Could not load courses. Please try again later.
          </p>
        ) : null}

        {empty ? (
          <p className="mt-12 text-center text-sm text-brand-dark-grey">No courses available yet</p>
        ) : null}

        {!isLoading && !isError && courses.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <LearnerCourseCard key={c.id} course={c} isAuthenticated={isAuthenticated} />
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
