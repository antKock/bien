// Ce que montre l'onglet Semaines un jour donné : la semaine à confirmer en
// carte pleine, la courante, la fantôme, puis toutes les semaines passées
// réduites, y compris les vides.
import { ajouterJours, type Jour } from "./jours";
import { debutSemaineAPreparer, etatSemaine, semaineVierge, type EtatSemaine, type SemaineInfo } from "./semaine";

export type EtatCarte = EtatSemaine | "vide";

export type Onglet = {
  /** La semaine passée la plus récente jamais clôturée, en carte pleine. */
  aConfirmer: Jour | null;
  /** À préparer le dimanche, en cours le reste de la semaine. */
  courante: Jour;
  /** La semaine suivante, seulement quand la courante est à préparer. */
  fantome: Jour | null;
  /** Les plus récentes d'abord, jusqu'à la première semaine renseignée. */
  passees: { debut: Jour; etat: EtatCarte }[];
};

export function composerOnglet(semaines: SemaineInfo[], aujourdhui: Jour): Onglet {
  const parDebut = new Map(semaines.map((s) => [s.debut, s]));
  const etatDe = (debut: Jour) => etatSemaine(parDebut.get(debut) ?? semaineVierge(debut), aujourdhui);

  const courante = debutSemaineAPreparer(aujourdhui);
  const fantome = etatDe(courante) === "a_preparer" ? ajouterJours(courante, 7) : null;

  // La semaine qui vient de finir se confirme même sans ligne : c'est l'étape 1 du rituel.
  const precedente = ajouterJours(courante, -7);
  const candidates = [...semaines.map((s) => s.debut), precedente]
    .filter((d) => d < courante && etatDe(d) === "a_confirmer")
    .sort();
  const aConfirmer = candidates.at(-1) ?? null;

  const debuts = semaines.map((s) => s.debut).filter((d) => d < courante);
  const premiere = debuts.length ? debuts.sort()[0] : precedente;
  const passees: Onglet["passees"] = [];
  for (let d = precedente; d >= premiere; d = ajouterJours(d, -7)) {
    if (d === aConfirmer) continue;
    passees.push({ debut: d, etat: parDebut.has(d) ? etatDe(d) : "vide" });
  }
  return { aConfirmer, courante, fantome, passees };
}
