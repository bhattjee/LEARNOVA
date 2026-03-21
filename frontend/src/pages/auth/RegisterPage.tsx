import axios from "axios";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import * as authService from "@/services/authService";
import type { UserRole } from "@/types/auth.types";

interface RegisterPageProps {}

function roleHome(role: UserRole): string {
  if (role === "admin" || role === "instructor") {
    return "/admin/dashboard";
  }
  return "/my-courses";
}

export function RegisterPage(_props: RegisterPageProps) {
  const navigate = useNavigate();
  const loginStore = useAuthStore((s) => s.login);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("learner");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
      });
      loginStore(res.access_token, res.user);
      navigate(roleHome(res.user.role), { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
        const data = err.response.data as { detail?: unknown };
        const { detail } = data;
        if (typeof detail === "string") {
          setError(detail);
          return;
        }
        if (Array.isArray(detail) && detail.length > 0 && typeof detail[0] === "object") {
          const first = detail[0] as { msg?: string };
          if (typeof first.msg === "string") {
            setError(first.msg);
            return;
          }
        }
      }
      setError("Could not create account. Please try again.");
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
          Create your account
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="reg-name" className="sr-only">
              Full name
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              required
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 w-full rounded-md border border-brand-mid-grey bg-white px-3 text-sm text-brand-black outline-none ring-primary-light focus:border-primary focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="sr-only">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-md border border-brand-mid-grey bg-white px-3 text-sm text-brand-black outline-none ring-primary-light focus:border-primary focus:ring-2"
            />
          </div>
          <div className="relative">
            <label htmlFor="reg-password" className="sr-only">
              Password
            </label>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Password (min 8 characters)"
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
          <div>
            <label htmlFor="reg-confirm" className="sr-only">
              Confirm password
            </label>
            <input
              id="reg-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 w-full rounded-md border border-brand-mid-grey bg-white px-3 text-sm text-brand-black outline-none ring-primary-light focus:border-primary focus:ring-2"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-brand-black">I am signing up as</legend>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-dark-grey">
              <input
                type="radio"
                name="role"
                checked={role === "learner"}
                onChange={() => setRole("learner")}
                className="border-brand-mid-grey text-primary focus:ring-primary"
              />
              I&apos;m a Learner
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-dark-grey">
              <input
                type="radio"
                name="role"
                checked={role === "instructor"}
                onChange={() => setRole("instructor")}
                className="border-brand-mid-grey text-primary focus:ring-primary"
              />
              I&apos;m an Instructor
            </label>
          </fieldset>

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
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-dark-grey">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
