import type { ReactNode } from "react";

// Carte standard : blanche, rayon 15, bordure, ombre triple très douce.
export function Carte({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-border bg-white shadow-card ${className}`}>{children}</div>;
}
