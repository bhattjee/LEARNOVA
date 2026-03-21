import { create } from "zustand";

export type UserRole = "ADMIN" | "INSTRUCTOR" | "LEARNER";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

const TOKEN_KEY = "learnova_access_token";
const USER_KEY = "learnova_user";

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      "email" in parsed &&
      "role" in parsed
    ) {
      const u = parsed as Record<string, unknown>;
      const role = u.role;
      if (role === "ADMIN" || role === "INSTRUCTOR" || role === "LEARNER") {
        return {
          id: String(u.id),
          email: String(u.email),
          role,
        };
      }
    }
  } catch {
    localStorage.removeItem(USER_KEY);
  }
  return null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: readStoredUser(),
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
}));

export { TOKEN_KEY };
