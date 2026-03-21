import type { ReactNode } from "react";
import { useAuthStore, type UserRole } from "@/stores/authStore";

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: readonly UserRole[];
}

export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-brand-dark-grey">
        <h1 className="text-2xl font-semibold text-brand-black">403</h1>
        <p className="mt-2">You do not have access to this page.</p>
      </div>
    );
  }

  return children;
}
