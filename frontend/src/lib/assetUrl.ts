/**
 * Upload APIs return paths like `/api/v1/uploads/<file>`. Browsers resolve those
 * against the frontend origin (e.g. Vite :5173), so images break unless we
 * prefix the API base used for axios (`VITE_API_BASE_URL`).
 */
export function resolvePublicFileUrl(url: string | null | undefined): string | null {
  if (url == null) {
    return null;
  }
  const u = String(url).trim();
  if (!u) {
    return null;
  }
  if (/^https?:\/\//i.test(u)) {
    return u;
  }
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  if (u.startsWith("/")) {
    return base ? `${base}${u}` : u;
  }
  return base ? `${base}/${u}` : u;
}
