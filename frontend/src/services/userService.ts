/**
 * userService.ts — Staff directory for admin/instructor UI.
 */
import { apiClient } from "@/services/apiClient";
import type { UserPublic } from "@/types/auth.types";

export async function getStaffUsers(): Promise<UserPublic[]> {
  const res = await apiClient.get<{ data: UserPublic[] }>("/api/v1/users");
  return res.data.data;
}
