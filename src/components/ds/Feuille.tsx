"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Feuille modale (`.sheet`) : voile sur tout l'écran, feuille ancrée en bas,
// poignée. Un seul gabarit ; son contenu est la feuille de nommage.
export function Feuille({ ouverte, onFermer, children }: { ouverte: boolean; onFermer: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouverte && !d.open) d.showModal();
    if (!ouverte && d.open) d.close();
  }, [ouverte]);
  return (
    <dialog
      ref={ref}
      onClose={onFermer}
      onClick={(e) => {
        if (e.target === ref.current) onFermer();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-[430px] justify-self-center rounded-t-sheet bg-cream px-5 pb-10 pt-2.5 shadow-[0_-14px_40px_rgba(26,26,24,.14)] backdrop:bg-[rgba(26,26,24,.34)] open:flex open:flex-col"
    >
      <div aria-hidden className="mx-auto mb-4 h-1 w-[38px] rounded-[3px] bg-dash" />
      {children}
    </dialog>
  );
}
