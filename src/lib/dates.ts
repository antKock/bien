// Formats d'affichage des dates, en heure de Paris. Le calendrier lui-même
// (jours civils, lundis, minuit) vit dans `domain/jours`.
import { FUSEAU } from "@/domain/jours";

export { FUSEAU };

/** « dimanche 16 novembre » */
export function formatJourLong(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSEAU,
  }).format(date);
}
