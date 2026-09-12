import Link from "next/link";
import { cocher, retirer, toutCocher } from "./actions";
import { Avatar } from "@/components/ds/Avatar";
import { Bouton } from "@/components/ds/Bouton";
import { Carte } from "@/components/ds/Carte";
import { Case, CaseBouton } from "@/components/ds/Case";
import { Croix } from "@/components/ds/Croix";
import { Pad } from "@/components/ds/Ecran";
import { EnteteEmpile, LienAccent } from "@/components/ds/EnteteEmpile";
import { ACTIVITES_LIBELLES, CRENEAUX_LIBELLES } from "@/components/semaine/copie";
import { nomsParId } from "@/db/noms";
import { initiales } from "@/domain/personnes";
import { estNonPrevu, estValidee } from "@/domain/semaine";
import { nomDuJour, nomSemaine } from "@/lib/dates";
import { contexteSemaine } from "@/lib/semaines";

// Écrans 09 et 19 : une ligne par séance. Avant validation, une croix pour
// retirer ; après, une case par séance et « Tout cocher ».
export default async function PageActivite({ params }: { params: Promise<{ debut: string }> }) {
  const { debut } = await params;
  const ctx = await contexteSemaine(debut);
  const seances = [...(ctx.semaine?.seances ?? [])].sort(
    (a, b) => a.jour - b.jour || a.creneau.localeCompare(b.creneau) || a.personneId.localeCompare(b.personneId),
  );
  const noms = await nomsParId(seances.flatMap((s) => (s.nomId ? [s.nomId] : [])));
  const confirmation = estValidee(ctx.info, ctx.jour);
  const cloturee = ctx.etat === "cloturee";
  const ini = initiales(ctx.personnes.map((p) => p.prenom));
  const n = seances.length;
  const sousTitre = confirmation
    ? `${nomSemaine(debut, true)} · confirmation`
    : `${n} séance${n > 1 ? "s" : ""} posée${n > 1 ? "s" : ""}`;

  return (
    <>
      <EnteteEmpile
        titre="Activité"
        sousTitre={sousTitre}
        retour="/semaines"
        droite={
          confirmation && !cloturee && seances.some((s) => !s.faite) ? (
            <form action={toutCocher.bind(null, debut)}>
              <LienAccent>Tout cocher</LienAccent>
            </form>
          ) : undefined
        }
      />
      <Pad className="flex flex-col gap-3">
        {n > 0 && (
          <Carte className="px-[15px] py-2">
            {seances.map((s) => {
              const idx = ctx.personnes.findIndex((p) => p.id === s.personneId);
              const meta = [nomDuJour(s.jour), CRENEAUX_LIBELLES[s.creneau], estNonPrevu(s.creeLe, ctx.info) ? "non prévu" : null]
                .filter(Boolean)
                .join(" · ");
              return (
                <div key={s.id} className="flex items-center gap-[11px] border-b border-[rgba(226,222,213,.9)] py-[11px] last:border-b-0">
                  <Avatar initiales={ini[idx] ?? "?"} ordre={ctx.personnes[idx]?.ordre ?? 1} />
                  <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.3]">
                    {s.activite === "autre" ? (noms.get(s.nomId ?? "") ?? "Autre") : ACTIVITES_LIBELLES[s.activite]}
                    <span className="mt-[3px] block font-mono text-[9.5px] tracking-[0.02em] text-faint">{meta}</span>
                  </span>
                  {cloturee ? (
                    <Case cochee={s.faite} />
                  ) : confirmation ? (
                    <form action={cocher.bind(null, debut, s.id, !s.faite)} className="flex">
                      <CaseBouton cochee={s.faite} libelle={s.faite ? "Faite" : "Pas faite"} />
                    </form>
                  ) : (
                    <form action={retirer.bind(null, debut, s.id)} className="flex">
                      <Croix libelle="Retirer" />
                    </form>
                  )}
                </div>
              );
            })}
          </Carte>
        )}
        {!cloturee && (
          <Link href={`/semaines/${debut}/activite/ajouter`}>
            <Bouton variante="secondaire" tabIndex={-1}>
              + Ajouter une séance
            </Bouton>
          </Link>
        )}
      </Pad>
    </>
  );
}
