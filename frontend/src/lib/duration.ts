/** Parse "H:MM" or "HH:MM" into total seconds (hours * 3600 + minutes * 60). */
export function parseDurationToSeconds(hhmm: string): number {
  const s = hhmm.trim();
  if (!s) return 0;
  const parts = s.split(":").map((x) => Number.parseInt(x.trim(), 10));
  if (parts.length === 2 && parts.every((n) => !Number.isNaN(n)) && parts[0]! >= 0 && parts[1]! >= 0) {
    return parts[0]! * 3600 + parts[1]! * 60;
  }
  const n = Number.parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
}

export function formatSecondsToHHMM(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}
