// Dates du rituel, lues en heure de Paris. La semaine commence le lundi (phase 2).

export const FUSEAU = "Europe/Paris";

/** « dimanche 16 novembre » */
export function formatJourLong(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSEAU,
  }).format(date);
}
