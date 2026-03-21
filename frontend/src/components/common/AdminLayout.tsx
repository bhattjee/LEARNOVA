import type { ReactNode } from "react";
import { BarChart2, BookOpen, BookText, LogOut } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const coursesActive =
    location.pathname.startsWith("/admin/dashboard") ||
    location.pathname.startsWith("/admin/courses");

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 border-l-[3px] px-4 py-3 text-sm font-medium text-white transition-colors",
      isActive
        ? "border-primary bg-[rgba(29,78,216,0.15)]"
        : "border-transparent hover:bg-white/5",
    );

  const coursesNavClass = cn(
    "flex items-center gap-3 border-l-[3px] px-4 py-3 text-sm font-medium text-white transition-colors",
    coursesActive
      ? "border-primary bg-[rgba(29,78,216,0.15)]"
      : "border-transparent hover:bg-white/5",
  );

  return (
    <div className="min-h-screen bg-brand-light-grey">
      <aside className="fixed bottom-0 left-0 top-0 z-40 flex w-[240px] flex-col bg-brand-black">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-5">
          <BookText className="h-6 w-6 shrink-0 text-white" aria-hidden />
          <span className="text-lg font-bold text-white">Learnova</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 pt-4">
          <Link to="/admin/dashboard" className={coursesNavClass}>
            <BookOpen className="h-5 w-5 shrink-0 opacity-90" />
            Courses
          </Link>
          <NavLink to="/admin/reporting" className={navClass}>
            <BarChart2 className="h-5 w-5 shrink-0 opacity-90" />
            Reporting
          </NavLink>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
              aria-hidden
            >
              {user ? initials(user.full_name) : "—"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.full_name ?? "—"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full min-h-9 items-center justify-center gap-2 rounded-md text-sm font-medium text-white/90 hover:bg-white/5 hover:text-status-danger"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <header className="fixed left-[240px] right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-brand-mid-grey bg-white px-6">
        <h1 className="text-lg font-semibold text-brand-black">{title}</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-brand-dark-grey sm:inline">{user?.full_name}</span>
          {user ? (
            <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
              {user.role}
            </span>
          ) : null}
        </div>
      </header>

      <main className="ml-[240px] min-h-screen bg-brand-light-grey pb-10 pt-16">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
