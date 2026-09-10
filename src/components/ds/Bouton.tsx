import type { ButtonHTMLAttributes } from "react";

// Le CTA (`.btn`) : 48 px, rayon 12. Un seul primaire par flux.
//   primaire   : dégradé accent, texte blanc — l'action attendue
//   secondaire : blanc bordé, texte ink — possible mais pas attendue ; c'est
//                aussi l'apparence du bouton ghost « + Ajouter… » en fin de liste
//   inactif    : blanc bordé, texte faint — la semaine vide qu'on peut quand même valider
const variantes = {
  primaire: "bg-btn text-white font-semibold shadow-btn",
  secondaire: "bg-white border border-border text-ink font-medium",
  inactif: "bg-white border border-border text-faint font-medium",
};

export function Bouton({
  variante = "primaire",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof variantes }) {
  return (
    <button
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-btn text-[14.5px] disabled:opacity-70 ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}
