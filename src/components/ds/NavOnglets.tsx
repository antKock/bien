"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barre de navigation (`.nav`) : 74 px, deux onglets seulement, dans une pilule
// blanche flottante. Présente uniquement sur les écrans de premier niveau.
const ONGLETS = [
  { href: "/semaines", libelle: "Semaines" },
  { href: "/tendances", libelle: "Tendances" },
] as const;

export function NavOnglets() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 bg-cream pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-[74px] max-w-[430px] items-center justify-center pb-4">
        <div className="flex rounded-pill border border-border bg-white p-1 shadow-card">
          {ONGLETS.map((o) => {
            const actif = pathname.startsWith(o.href);
            return (
              <Link
                key={o.href}
                href={o.href}
                aria-current={actif ? "page" : undefined}
                className={`rounded-pill px-5 py-[9px] text-[13px] ${
                  actif ? "bg-soft font-semibold text-accent-d" : "font-medium text-nav-off"
                }`}
              >
                {o.libelle}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
