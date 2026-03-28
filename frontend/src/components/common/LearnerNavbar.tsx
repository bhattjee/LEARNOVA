import { useState } from "react";
import { ChevronDown } from "lucide-react";
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

function navLinkClassForVariant(variant: "default" | "dark") {
  return ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex h-16 items-center border-b-2 px-1 text-sm font-medium transition-colors",
      variant === "dark"
        ? isActive
          ? "border-[#9333EA] text-[#D8B4FE]"
          : "border-transparent text-zinc-400 hover:text-white"
        : isActive
          ? "border-primary text-primary"
          : "border-transparent text-brand-dark-grey hover:text-brand-black",
    );
}

export interface LearnerNavbarProps {
  /** Dark header for learner course detail and similar immersive pages. */
  variant?: "default" | "dark";
}

export function LearnerNavbar({ variant = "default" }: LearnerNavbarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = navLinkClassForVariant(variant);
  const isDark = variant === "dark";

  return (
    <header
      className={cn(
        "relative z-40 h-16 w-full border-b",
        isDark ? "border-zinc-800 bg-[#121212]" : "border-brand-mid-grey bg-white",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center px-6">
        <Link to="/courses" className="flex shrink-0 items-center gap-2">
          <img
            src="/logo.png"
            alt=""
            className="h-9 w-auto"
            decoding="async"
          />
          <span
            className={cn("text-xl font-bold", isDark ? "text-white" : "text-primary")}
          >
            Learnova
          </span>
        </Link>

        <nav
          className="absolute left-1/2 top-0 flex h-16 -translate-x-1/2 items-center justify-center gap-10"
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
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary-light",
                    isDark ? "hover:bg-zinc-800" : "hover:bg-brand-light-grey",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                      isDark
                        ? "bg-[#9333EA]/30 text-[#E9D5FF]"
                        : "bg-primary-light text-primary",
                    )}
                    aria-hidden
                  >
                    {initials(user.full_name)}
                  </span>
                  <span
                    className={cn(
                      "hidden max-w-[140px] truncate text-sm font-medium sm:inline",
                      isDark ? "text-zinc-100" : "text-brand-black",
                    )}
                  >
                    {user.full_name}
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4", isDark ? "text-zinc-400" : "text-brand-dark-grey")}
                    aria-hidden
                  />
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
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium",
                  isDark
                    ? "text-zinc-200 hover:bg-zinc-800"
                    : "text-primary hover:bg-primary-light",
                )}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-white transition-colors",
                  isDark ? "bg-[#9333EA] hover:bg-[#7C3AED]" : "bg-primary hover:bg-primary-hover",
                )}
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
