// Les sous-titres des quatre lignes de la carte : une phrase factuelle par
// état, jamais un manque signalé. Les comptes viennent du domaine.
import type { Mesure, Personne, Seance } from "@/db/schema";
import { prochaineSeance, resumeActivite } from "@/domain/activite";
import { jourSemaine, type Jour } from "@/domain/jours";
import { sujetAJour, type EtatSemaine, type SemaineInfo } from "@/domain/semaine";
import { JOURS_ABREGES, nomDuJour } from "@/lib/dates";
import type { LigneSujet } from "./CarteSemaine";

type Ligne = Omit<LigneSujet, "sujet" | "libelle" | "href">;

export function formatPoids(v: number): string {
  return v.toFixed(1).replace(".", ",");
}

export const CRENEAUX_LIBELLES = { matin: "matin", midi: "midi", soir: "soir" } as const;
export const ACTIVITES_LIBELLES = { course: "Course", pilates: "Pilates", renfo: "Renfo", velo: "Vélo", autre: "Autre" } as const;

export function ligneMesures(mesures: Mesure[], personnes: Personne[], etat: EtatSemaine): Ligne {
  const poids = personnes.map((p) => mesures.find((m) => m.personneId === p.id && m.type === "poids")?.valeur ?? null);
  const notees = poids.filter((v) => v !== null).length;
  if (notees === 0) {
    return {
      sousTitre: etat === "a_preparer" ? "À noter ce matin" : "Aucune mesure",
      aFaire: true,
      ton: "vide",
    };
  }
  const valeurs = poids.map((v) => (v === null ? "—" : formatPoids(v))).join(" · ");
  const toutes = notees === personnes.length;
  return {
    sousTitre: `${valeurs} kg${etat === "a_preparer" && toutes ? " · notées" : ""}`,
    ton: toutes ? "fait" : "plein",
    pastille: etat === "a_confirmer" ? { texte: "noté" } : undefined,
  };
}

export function ligneActivite(
  seances: Seance[],
  personnes: Personne[],
  info: SemaineInfo,
  etat: EtatSemaine,
  aujourdhui: Jour,
): Ligne {
  if (seances.length === 0) return { sousTitre: "Aucune séance posée", aFaire: true, ton: "vide" };
  const { posees, faites } = resumeActivite(seances);
  const s = posees > 1 ? "s" : "";
  if (etat === "a_preparer") {
    const sousTitre =
      posees <= 2
        ? seances
            .map((x) => {
              const prenom = personnes.find((p) => p.id === x.personneId)?.prenom ?? "";
              return `${prenom} ${JOURS_ABREGES[x.jour - 1]} ${CRENEAUX_LIBELLES[x.creneau]}`;
            })
            .join(" · ")
        : `${posees} séances posées`;
    return { sousTitre, ton: "plein" };
  }
  if (etat === "en_cours") {
    // Validée d'avance (le dimanche), la semaine n'a pas commencé : la prochaine est la première.
    const prochaine = prochaineSeance(seances, aujourdhui < info.debut ? 1 : jourSemaine(aujourdhui));
    const suite = prochaine === null ? "" : ` · la prochaine ${nomDuJour(prochaine)}`;
    return { sousTitre: `${posees} séance${s}${suite}`, ton: "plein" };
  }
  const dernierGeste = seances.reduce<Date | null>((d, x) => {
    const g = x.modifieLe ?? x.creeLe;
    return d === null || g > d ? g : d;
  }, null);
  return {
    sousTitre: `${faites} faite${faites > 1 ? "s" : ""} sur ${posees}`,
    ton: "plein",
    pastille: etat === "a_confirmer" ? { texte: sujetAJour(dernierGeste, info) ? "à jour" : "à remplir" } : undefined,
  };
}

// Jokers et plats n'arrivent qu'en phase 3 et 4 : leur ligne est là, vide.
export function ligneJokers(): Ligne {
  return { sousTitre: "Aucun posé · 3 par semaine", aFaire: true, ton: "vide" };
}

export function lignePlats(): Ligne {
  return { sousTitre: "Aucun plat choisi", aFaire: true, ton: "vide" };
}
