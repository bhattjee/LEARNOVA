/**
 * Auth-related types aligned with the FastAPI auth API.
 */

export type UserRole = "admin" | "instructor" | "learner";

export interface UserPublic {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  total_points: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserPublic;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

export interface TokenDataEnvelope {
  data: TokenResponse;
}

export interface UserDataEnvelope {
  data: UserPublic;
}
