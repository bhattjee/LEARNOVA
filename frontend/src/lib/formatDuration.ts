/** Format seconds as "2h 15m" (or "45m", "0m" if zero). */
export function formatDurationShort(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  if (sec === 0) return "0m";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m}m`;
}

/** Total duration for course cards / dashboard (handles nullish). */
export function formatDuration(totalSeconds: number | undefined | null): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) return "0m";
  return formatDurationShort(totalSeconds);
}
