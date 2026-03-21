import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) {
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-light-grey text-brand-dark-grey">
        Loading…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
