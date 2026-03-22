import { BarChart2, BookOpen, ExternalLink, Mail, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-black">Settings</h2>
        <p className="mt-1 max-w-2xl text-sm text-brand-dark-grey">
          Workspace preferences and account summary. Transactional emails (invite learners, contact attendees) use
          your configured provider — ensure API keys are set in the deployment environment.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-brand-mid-grey bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-dark-grey">
            <Shield className="h-4 w-4 text-primary" aria-hidden />
            Account
          </div>
          {user ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-brand-dark-grey">Name</dt>
                <dd className="mt-0.5 font-semibold text-brand-black">{user.full_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-brand-dark-grey">Email</dt>
                <dd className="mt-0.5 font-medium text-brand-black">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-brand-dark-grey">Role</dt>
                <dd className="mt-0.5 capitalize text-brand-black">{user.role}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-brand-dark-grey">Sign in to see your account details.</p>
          )}
        </section>

        <section className="rounded-2xl border border-brand-mid-grey bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-dark-grey">
            <Mail className="h-4 w-4 text-primary" aria-hidden />
            Email &amp; attendees
          </div>
          <p className="mt-3 text-sm leading-relaxed text-brand-dark-grey">
            When you use <strong>Add attendees</strong> or <strong>Contact attendees</strong> on a course, the app
            may show a short configuration reminder if transactional email is not set up. Delivery depends on your
            backend environment (e.g. Resend API key).
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-brand-mid-grey bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-dark-grey">Quick links</p>
        <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <li>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-brand-mid-grey bg-brand-light-grey/50 px-4 py-2.5 text-sm font-semibold text-brand-black transition-colors hover:bg-brand-light-grey"
            >
              <BookOpen className="h-4 w-4 text-primary" aria-hidden />
              Courses dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/admin/reporting"
              className="inline-flex items-center gap-2 rounded-lg border border-brand-mid-grey bg-brand-light-grey/50 px-4 py-2.5 text-sm font-semibold text-brand-black transition-colors hover:bg-brand-light-grey"
            >
              <BarChart2 className="h-4 w-4 text-primary" aria-hidden />
              Reporting
              <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
