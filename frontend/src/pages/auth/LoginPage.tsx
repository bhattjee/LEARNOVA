interface LoginPageProps {}

/**
 * TODO: Phase 1 — email/password form and auth API.
 */
export function LoginPage(_props: LoginPageProps) {
  return (
    <div className="min-h-screen bg-brand-light-grey">
      {import.meta.env.DEV ? (
        <div
          className="bg-primary py-2 text-center text-sm font-medium text-white"
          data-testid="phase0-primary-token"
        >
          Phase 0 check: bg-primary + text-white (#1D4ED8)
        </div>
      ) : null}
      <div className="mx-auto max-w-md p-8">
        <h1 className="text-2xl font-semibold text-brand-black">Login</h1>
        <p className="mt-2 text-sm text-brand-dark-grey">Placeholder — Phase 1</p>
      </div>
    </div>
  );
}
