import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-light-grey px-6 text-center">
      <div className="relative mb-8">
        <h1 className="text-9xl font-black text-primary/10 select-none">404</h1>
        <div className="absolute inset-0 flex items-center justify-center pt-8">
          <p className="text-2xl font-bold text-brand-black">Page Not Found</p>
        </div>
      </div>
      
      <p className="mb-10 max-w-md text-base text-brand-dark-grey">
        Oops! The page you're looking for doesn't exist or has been moved. 
        Let's get you back on track.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={() => window.history.back()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-mid-grey bg-white px-6 text-sm font-semibold text-brand-black transition-all hover:bg-brand-light-grey"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
        <Link
          to="/"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="mt-20">
        <p className="text-xs font-medium uppercase tracking-widest text-brand-dark-grey/50">
          Learnova Studio · Digital Learning
        </p>
      </div>
    </div>
  );
}
