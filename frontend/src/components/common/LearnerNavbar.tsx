import { useState } from "react";
import { ChevronDown, GraduationCap } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium transition-colors",
    isActive
      ? "border-b-2 border-primary pb-[22px] text-primary"
      : "border-b-2 border-transparent pb-[22px] text-brand-dark-grey hover:text-brand-black",
  );

export function LearnerNavbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-40 h-16 w-full border-b border-brand-mid-grey bg-white">
      <div className="mx-auto flex h-full max-w-[1400px] items-center px-6">
        <Link to="/courses" className="flex shrink-0 items-center gap-1.5">
          <GraduationCap className="h-6 w-6 text-primary" aria-hidden />
          <span className="text-xl font-bold text-primary">Learnova</span>
        </Link>

        <nav
          className="absolute left-1/2 top-0 flex h-16 -translate-x-1/2 items-stretch gap-10"
          aria-label="Main"
        >
          <NavLink to="/courses" className={navLinkClass}>
            Courses
          </NavLink>
          <NavLink to="/my-courses" className={navLinkClass}>
            My Courses
          </NavLink>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {user ? (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none hover:bg-brand-light-grey focus-visible:ring-2 focus-visible:ring-primary-light"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary"
                    aria-hidden
                  >
                    {initials(user.full_name)}
                  </span>
                  <span className="hidden max-w-[140px] truncate text-sm font-medium text-brand-black sm:inline">
                    {user.full_name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-brand-dark-grey" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link to="/my-courses" onClick={() => setMenuOpen(false)}>
                    My Courses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-primary hover:bg-primary-light"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
