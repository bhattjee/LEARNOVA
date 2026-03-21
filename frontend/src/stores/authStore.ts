import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UserPublic } from "@/types/auth.types";

interface AuthState {
  token: string | null;
  user: UserPublic | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserPublic) => void;
  logout: () => void;
  setUser: (user: UserPublic) => void;
}

function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => {
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        redirectToLogin();
      },
      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: "learnova-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<Pick<AuthState, "token" | "user">>;
        const token = p.token ?? null;
        const user = p.user ?? null;
        return {
          ...current,
          token,
          user,
          isAuthenticated: token !== null,
        };
      },
    },
  ),
);

export type { UserRole } from "@/types/auth.types";
