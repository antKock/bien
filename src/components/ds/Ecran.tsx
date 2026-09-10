import type { ReactNode } from "react";

// Le gabarit de tout écran : colonne de 390 px max centrée sur crème, et la
// place de la barre de navigation en bas sur les écrans de premier niveau.
export function Ecran({ children, avecNav = false }: { children: ReactNode; avecNav?: boolean }) {
  return (
    <main
      className={`mx-auto flex min-h-dvh w-full max-w-[430px] flex-col pt-[env(safe-area-inset-top)] ${
        avecNav ? "pb-[calc(74px+env(safe-area-inset-bottom))]" : ""
      }`}
    >
      {children}
    </main>
  );
}

/** Le bloc de contenu avec la marge latérale d'écran (20 px, `.pad`). */
export function Pad({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 ${className}`}>{children}</div>;
}
