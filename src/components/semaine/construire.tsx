import { cloturerSemaine, rouvrirSemaine, validerSemaine } from "@/app/(app)/semaines/actions";
import { Bouton } from "@/components/ds/Bouton";
import { Chip } from "@/components/ds/Chip";
import type { Personne } from "@/db/schema";
import { infoRecette, type RecetteChargee } from "@/db/recettes";
import { infoDe, type SemaineChargee } from "@/db/semaines";
import { listeCourses } from "@/domain/plats";
import { platsDeLaSemaine } from "@/lib/plats";
import { jourDe, type Jour } from "@/domain/jours";
import { etatSemaine, semaineVierge, type EtatSemaine } from "@/domain/semaine";
import { nomSemaine, numeroDuJour } from "@/lib/dates";
import { CarteSemaine, type LigneSujet } from "./CarteSemaine";
import { ligneActivite, ligneJokers, ligneMesures, lignePlats } from "./copie";

// Construit la carte d'une semaine dans son état du jour. C'est le seul
// endroit qui décide du titre, du chip, des lignes et du pied selon l'état.

export const CHIPS: Record<EtatSemaine | "vide", string> = {
  a_preparer: "à préparer",
  en_cours: "en cours",
  a_confirmer: "à confirmer",
  cloturee: "clôturée",
  vide: "vide",
};

export function titreSemaine(debut: Jour, passee: boolean): string {
  return `Semaine ${nomSemaine(debut, passee)}`;
}

export async function CarteDeSemaine({
  debut,
  semaine,
  personnes,
  aujourdhui,
  recettes,
}: {
  debut: Jour;
  semaine: SemaineChargee | null;
  personnes: Personne[];
  aujourdhui: Jour;
  recettes: RecetteChargee[];
}) {
  const info = semaine ? infoDe(semaine) : semaineVierge(debut);
  const etat = etatSemaine(info, aujourdhui);
  const mesures = semaine?.mesures ?? [];
  const seances = semaine?.seances ?? [];
  const ecarts = semaine?.ecarts ?? [];
  const plats = semaine?.plats ?? [];
  const vues = await platsDeLaSemaine(semaine, info, recettes);
  const nbArticles = listeCourses(
    vues.flatMap((p) => (p.recette ? [{ recette: infoRecette(p.recette), repas: p.repas }] : [])),
    personnes.length,
  ).nbArticles;
  const cloturee = etat === "cloturee";
  const lien = (sujet: string) => (cloturee ? undefined : `/semaines/${debut}/${sujet}`);

  const brutes: LigneSujet[] = [
    { sujet: "mesures", libelle: "Mesures", href: lien("mesures"), ...ligneMesures(mesures, personnes, etat) },
    { sujet: "jokers", libelle: "Jokers", href: lien("jokers"), ...ligneJokers(ecarts, info, etat, aujourdhui) },
    { sujet: "plats", libelle: "Plats", href: lien("plats"), ...lignePlats(plats, nbArticles, info, etat) },
    { sujet: "activite", libelle: "Activité", href: lien("activite"), ...ligneActivite(seances, personnes, info, etat, aujourdhui) },
  ];
  const lignes = brutes.map((l): LigneSujet => (cloturee ? { ...l, ton: "vide", pastille: undefined } : l));

  if (etat === "a_preparer") {
    const vide = mesures.length === 0 && seances.length === 0 && ecarts.length === 0 && plats.length === 0;
    return (
      <CarteSemaine
        titre={titreSemaine(debut, false)}
        chip={<Chip ton="acc">{CHIPS[etat]}</Chip>}
        lignes={lignes}
        pied={
          <form action={validerSemaine.bind(null, debut)} className="flex-1">
            <Bouton variante={vide ? "inactif" : "primaire"}>Valider la semaine</Bouton>
          </form>
        }
      />
    );
  }
  if (etat === "en_cours") {
    return <CarteSemaine titre={titreSemaine(debut, false)} chip={<Chip ton="acc">{CHIPS[etat]}</Chip>} lignes={lignes} />;
  }
  if (etat === "a_confirmer") {
    return (
      <CarteSemaine
        titre="Ce qui s'est passé"
        chip={<Chip ton="pose">{nomSemaine(debut, true)}</Chip>}
        lignes={lignes}
        pied={
          <form action={cloturerSemaine.bind(null, debut)} className="flex-1">
            <Bouton>Clôturer la semaine</Bouton>
          </form>
        }
      />
    );
  }
  const jourCloture = jourDe(info.clotureeLe!);
  return (
    <CarteSemaine
      passee
      titre={titreSemaine(debut, true)}
      chip={<Chip>{CHIPS.cloturee}</Chip>}
      lignes={lignes}
      pied={
        <>
          <span className="flex-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint">
            Clôturée le {numeroDuJour(jourCloture, jourCloture.slice(0, 7) !== aujourdhui.slice(0, 7))}
          </span>
          <form action={rouvrirSemaine.bind(null, debut)}>
            <button type="submit" className="text-[12px] text-accent">
              rouvrir
            </button>
          </form>
        </>
      }
    />
  );
}
