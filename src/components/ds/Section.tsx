import type { ReactNode } from "react";

// Libellé de section (`.sec`) : mono 10 px, majuscules espacées, faint.
export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[10px] uppercase tracking-[0.13em] text-faint ${className}`}>{children}</div>
  );
}
