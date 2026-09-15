// Les sous-titres des quatre lignes de la carte : une phrase factuelle par
// état, jamais un manque signalé. Les comptes viennent du domaine.
import type { Ecart, Mesure, Personne, Seance } from "@/db/schema";
import { prochaineSeance, resumeActivite } from "@/domain/activite";
import { BUDGET_JOKERS, bilanJokers } from "@/domain/jokers";
import { resumePlats } from "@/domain/plats";
import { jourSemaine, type Jour } from "@/domain/jours";
import { jokersAJour, sujetAJour, type EtatSemaine, type SemaineInfo } from "@/domain/semaine";
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

/** « 1,5 » ; les jetons se comptent en demi-unités. */
export function formatJetons(n: number): string {
  return String(n).replace(".", ",");
}

// En français, le pluriel commence à 2 : « 1,5 posé », « 2 posés ».
const jetons = (n: number, mot: string) => `${formatJetons(n)} ${mot}${n >= 2 ? "s" : ""}`;

export function ligneJokers(ecarts: Ecart[], info: SemaineInfo, etat: EtatSemaine, aujourdhui: Jour): Ligne {
  const vide = { sousTitre: `Aucun posé · ${BUDGET_JOKERS} par semaine`, aFaire: true, ton: "vide" as const };
  if (ecarts.length === 0 && etat !== "a_confirmer") return vide;
  const b = bilanJokers(ecarts, info, aujourdhui);
  if (etat === "a_preparer") {
    return { sousTitre: `${jetons(b.pose, "posé")} · ${BUDGET_JOKERS} par semaine`, ton: "jokers" };
  }
  if (etat === "en_cours") {
    return { sousTitre: `${jetons(b.pose, "posé")} · ${jetons(b.consomme, "consommé")}`, ton: "jokers" };
  }
  const aJour = jokersAJour(info);
  if (etat === "a_confirmer" && !aJour) {
    return { sousTitre: "Les sept soirs, en une passe", aFaire: true, ton: "jokers", pastille: { texte: "à remplir", ton: "jokers" } };
  }
  const audela = b.consomme - BUDGET_JOKERS;
  const suite = audela > 0 ? ` · ${formatJetons(audela)} au-delà` : b.improvise > 0 ? ` · ${jetons(b.improvise, "non prévu")}` : "";
  return {
    sousTitre: b.consomme === 0 ? "Aucun consommé" : `${jetons(b.consomme, "consommé")}${suite}`,
    ton: b.consomme === 0 ? "vide" : "jokers",
    pastille: etat === "a_confirmer" ? { texte: "à jour" } : undefined,
  };
}

export type PlatResume = { repas: number; repasCuisines: number; creeLe: Date; modifieLe: Date | null };

export function lignePlats(plats: PlatResume[], nbArticles: number, info: SemaineInfo, etat: EtatSemaine): Ligne {
  if (plats.length === 0) return { sousTitre: "Aucun plat choisi", aFaire: true, ton: "vide" };
  const r = resumePlats(plats);
  const s = (n: number) => (n > 1 ? "s" : "");
  if (etat === "a_preparer") {
    return { sousTitre: `${r.plats} plat${s(r.plats)} · ${r.repas} repas · ${nbArticles} article${s(nbArticles)}`, ton: "plein" };
  }
  if (etat === "en_cours") {
    return { sousTitre: `${r.repas} repas · ${r.cuisines} cuisiné${s(r.cuisines)}`, ton: "plein" };
  }
  const non = r.repas - r.cuisines;
  const dernierGeste = plats.reduce<Date | null>((d, x) => {
    const g = x.modifieLe ?? x.creeLe;
    return d === null || g > d ? g : d;
  }, null);
  return {
    sousTitre: `${r.cuisines} repas cuisiné${s(r.cuisines)}${non > 0 ? ` · ${non} non cuisiné${s(non)}` : ""}`,
    ton: "plein",
    pastille: etat === "a_confirmer" ? { texte: sujetAJour(dernierGeste, info) ? "à jour" : "à remplir" } : undefined,
  };
}
