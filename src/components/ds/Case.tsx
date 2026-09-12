// La case à cocher (`.box`) : 20 × 20, rayon 6. Le seul mécanisme de sélection
// et de confirmation de l'app (règles ② et ③). Rendue par un bouton quand elle
// agit (formulaire), par un simple span quand elle ne fait qu'afficher.
const base = "relative inline-block h-5 w-5 flex-none rounded-box border-[1.6px]";
const coche =
  "after:absolute after:left-[5.5px] after:top-[3px] after:h-[10px] after:w-[6.5px] after:rotate-40 after:border-white after:border-r-[1.8px] after:border-b-[1.8px] after:content-['']";

function classes(cochee: boolean) {
  return `${base} ${cochee ? `border-accent bg-accent ${coche}` : "border-box bg-white"}`;
}

export function Case({ cochee }: { cochee: boolean }) {
  return <span aria-hidden className={classes(cochee)} />;
}

/** Une case qui soumet le formulaire qui l'entoure. */
export function CaseBouton({ cochee, libelle, ...props }: { cochee: boolean; libelle: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      role="checkbox"
      aria-checked={cochee}
      aria-label={libelle}
      className={`${classes(cochee)} touch-manipulation`}
      {...props}
    />
  );
}
