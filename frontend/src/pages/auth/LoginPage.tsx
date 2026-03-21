import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import * as authService from "@/services/authService";
import type { UserRole } from "@/types/auth.types";

interface LoginPageProps {}

function roleHome(role: UserRole): string {
  if (role === "admin" || role === "instructor") {
    return "/admin/dashboard";
  }
  return "/my-courses";
}

export function LoginPage(_props: LoginPageProps) {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authService.login({ email: email.trim(), password });
      loginStore(res.access_token, res.user);
      navigate(roleHome(res.user.role), { replace: true });
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light-grey px-4 py-10">
      <div
        className="w-full max-w-[440px] rounded-xl border border-brand-mid-grey bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
      >
        <h1 className="text-center text-2xl font-bold text-primary">Learnova</h1>
        <p className="mt-2 text-center text-sm text-brand-dark-grey">
          Sign in to your account
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="login-email" className="sr-only">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-md border border-brand-mid-grey bg-white px-3 text-sm text-brand-black outline-none ring-primary-light focus:border-primary focus:ring-2"
            />
          </div>
          <div className="relative">
            <label htmlFor="login-password" className="sr-only">
              Password
            </label>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-md border border-brand-mid-grey bg-white px-3 pr-10 text-sm text-brand-black outline-none ring-primary-light focus:border-primary focus:ring-2"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-dark-grey hover:text-brand-black"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {error ? (
            <p className="text-sm text-status-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex h-9 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-dark-grey">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:text-primary-hover">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
