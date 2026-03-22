import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CircularProgressRingProps {
  /** 0–1 progress to display on the ring */
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}

export function CircularProgressRing({
  progress,
  size = 152,
  strokeWidth = 10,
  className,
  children,
}: CircularProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const raw = Math.min(1, Math.max(0, progress));
  const p = Number.isFinite(raw) ? raw : 0;
  const offset = c * (1 - p);

  return (
    <div
      className={cn("relative mx-auto flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-brand-light-grey"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-status-success transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        {children}
      </div>
    </div>
  );
}
