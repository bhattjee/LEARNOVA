/**
 * Parse YouTube (and similar) URL for a start offset in seconds.
 * Supports: ?t=120, ?t=2m, ?start=45, youtu.be/xxx?t=1h2m10s
 */
export function getVideoStartSeconds(url: string | null | undefined): number | undefined {
  if (!url?.trim()) {
    return undefined;
  }
  const raw = url.trim();
  try {
    const withProto = raw.includes("://") ? raw : `https://${raw}`;
    const u = new URL(withProto);
    const t = u.searchParams.get("t") ?? u.searchParams.get("start");
    if (!t) {
      return undefined;
    }
    if (/^\d+$/.test(t)) {
      return parseInt(t, 10);
    }
    if (/^\d+(\.\d+)?s$/i.test(t)) {
      return Math.floor(parseFloat(t));
    }
    let sec = 0;
    const h = t.match(/(\d+)\s*h/i);
    const m = t.match(/(\d+)\s*m/i);
    const s = t.match(/(\d+)\s*s/i);
    if (h) {
      sec += parseInt(h[1], 10) * 3600;
    }
    if (m) {
      sec += parseInt(m[1], 10) * 60;
    }
    if (s) {
      sec += parseInt(s[1], 10);
    }
    if (h || m || s) {
      return sec;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function formatPlaybackClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
