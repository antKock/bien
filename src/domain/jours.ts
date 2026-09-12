// Dates civiles, sans heure : « 2026-11-16 ». Tout le domaine raisonne sur ces
// jours et sur des instants (Date) uniquement pour la trace. Le fuseau de
// référence est celui du foyer, Paris.

export const FUSEAU = "Europe/Paris";

export type Jour = string; // YYYY-MM-DD

/** Jour civil d'un instant, dans le fuseau. */
export function jourDe(instant: Date, fuseau = FUSEAU): Jour {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function utcDe(jour: Jour): number {
  const [a, m, j] = jour.split("-").map(Number);
  return Date.UTC(a, m - 1, j);
}

export function ajouterJours(jour: Jour, n: number): Jour {
  return new Date(utcDe(jour) + n * 86_400_000).toISOString().slice(0, 10);
}

/** 1 = lundi … 7 = dimanche. */
export function jourSemaine(jour: Jour): number {
  return ((new Date(utcDe(jour)).getUTCDay() + 6) % 7) + 1;
}

export function lundiDe(jour: Jour): Jour {
  return ajouterJours(jour, 1 - jourSemaine(jour));
}

export function estLundi(jour: Jour): boolean {
  return jourSemaine(jour) === 1;
}

function decalage(instant: number, fuseau: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: fuseau,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const v = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second")) - instant;
}

/** L'instant où commence un jour civil (minuit dans le fuseau). */
export function debutDuJour(jour: Jour, fuseau = FUSEAU): Date {
  const local = utcDe(jour);
  const premier = local - decalage(local, fuseau);
  return new Date(local - decalage(premier, fuseau));
}
