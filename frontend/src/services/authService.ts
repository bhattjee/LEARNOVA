import { apiClient } from "@/services/apiClient";
import type {
  LoginRequest,
  RegisterRequest,
  TokenDataEnvelope,
  UserDataEnvelope,
  UserPublic,
} from "@/types/auth.types";

export async function login(data: LoginRequest) {
  const res = await apiClient.post<TokenDataEnvelope>("/api/v1/auth/login", data);
  return res.data.data;
}

export async function register(data: RegisterRequest) {
  const res = await apiClient.post<TokenDataEnvelope>("/api/v1/auth/register", data);
  return res.data.data;
}

export async function getMe(): Promise<UserPublic> {
  const res = await apiClient.get<UserDataEnvelope>("/api/v1/auth/me");
  return res.data.data;
}
