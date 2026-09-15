import Link from "next/link";

// Le bouton icône (`.iconbtn`) : un seul dans toute l'app, le panier dans
// l'en-tête de l'écran Plats, avec le nombre d'articles en badge.
const PANIER = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h2l2.2 10.2A2 2 0 0010.2 17h6.9a2 2 0 002-1.6L21 8H7" />
    <circle cx="10.5" cy="20" r="1.2" />
    <circle cx="17.5" cy="20" r="1.2" />
  </svg>
);

export function BoutonPanier({ href, badge }: { href: string; badge: number }) {
  return (
    <Link
      href={href}
      aria-label={`Liste de courses, ${badge} articles`}
      className="relative flex h-10 w-10 flex-none items-center justify-center rounded-btn border border-border bg-white text-accent-d shadow-card"
    >
      {PANIER}
      {badge > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-[10px] bg-ink px-[5px] font-mono text-[9.5px] text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
