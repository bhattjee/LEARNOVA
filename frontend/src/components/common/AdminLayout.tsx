import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BarChart2, BookOpen, LogOut, Menu, Settings } from "lucide-react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onViewport = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    mq.addEventListener("change", onViewport);
    return () => mq.removeEventListener("change", onViewport);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const coursesActive =
    location.pathname.startsWith("/admin/dashboard") ||
    location.pathname.startsWith("/admin/courses");

  const settingsActive = location.pathname.startsWith("/admin/settings");

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 border-l-[3px] px-4 py-3 text-sm font-medium text-white transition-colors",
      isActive
        ? "border-primary bg-[rgba(29,78,216,0.15)]"
        : "border-transparent hover:bg-white/5",
    );

  const coursesNavClass = cn(
    "flex items-center gap-3 border-l-[3px] px-4 py-3 text-sm font-medium text-white transition-colors",
    coursesActive && !settingsActive
      ? "border-primary bg-[rgba(29,78,216,0.15)]"
      : "border-transparent hover:bg-white/5",
  );

  return (
    <div className="min-h-screen bg-brand-light-grey">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 flex w-[min(17.5rem,88vw)] flex-col bg-[#475569] shadow-2xl transition-transform duration-200 ease-out",
          "lg:z-40 lg:w-[240px] lg:translate-x-0 lg:shadow-none",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
          <img
            src="/logo.png"
            alt=""
            className="h-8 w-auto shrink-0"
            decoding="async"
          />
          <span className="text-lg font-bold text-white">Learnova</span>
        </div>

        <nav id="admin-sidebar-nav" className="flex flex-1 flex-col gap-0.5 overflow-y-auto pt-4">
          <Link to="/admin/dashboard" className={coursesNavClass}>
            <BookOpen className="h-5 w-5 shrink-0 opacity-90" />
            Courses
          </Link>
          <NavLink to="/admin/reporting" className={navClass}>
            <BarChart2 className="h-5 w-5 shrink-0 opacity-90" />
            Reporting
          </NavLink>
          <NavLink to="/admin/settings" className={navClass}>
            <Settings className="h-5 w-5 shrink-0 opacity-90" />
            Setting
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
            className="mt-2 flex w-full min-h-10 items-center justify-center gap-2 rounded-md bg-status-danger text-sm font-bold text-white transition-colors hover:bg-status-danger/90"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-brand-mid-grey bg-white px-4 sm:px-6 lg:left-[240px]">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent text-brand-dark-grey transition-colors hover:border-brand-mid-grey hover:bg-brand-light-grey lg:hidden"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-expanded={mobileNavOpen}
            aria-controls="admin-sidebar-nav"
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 truncate text-base font-semibold text-brand-black sm:text-lg">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden text-sm text-brand-dark-grey sm:inline">{user?.full_name}</span>
          {user ? (
            <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
              {user.role}
            </span>
          ) : null}
        </div>
      </header>

      <main className="min-h-screen bg-brand-light-grey pb-12 pt-16 lg:ml-[240px]">
        <div className="mx-auto w-full max-w-[1680px] p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}