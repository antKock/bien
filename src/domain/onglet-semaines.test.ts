import { describe, expect, it } from "vitest";
import { composerOnglet } from "./onglet-semaines";
import { semaineVierge } from "./semaine";

const a = (iso: string) => new Date(iso);
const S10 = semaineVierge("2025-11-10");
const S17 = semaineVierge("2025-11-17");

describe("l'onglet Semaines", () => {
  it("le dimanche, sans aucune donnée : la semaine finie à confirmer, la suivante à préparer, la fantôme", () => {
    expect(composerOnglet([], "2025-11-16")).toEqual({
      aConfirmer: "2025-11-10",
      courante: "2025-11-17",
      fantome: "2025-11-24",
      passees: [],
    });
  });

  it("le mardi : la courante en cours, pas de fantôme", () => {
    const o = composerOnglet([S17], "2025-11-18");
    expect(o.courante).toBe("2025-11-17");
    expect(o.fantome).toBeNull();
  });

  it("le dimanche après validation manuelle, la fantôme disparaît", () => {
    const validee = { ...S17, valideeLe: a("2025-11-16T15:00:00Z") };
    expect(composerOnglet([validee], "2025-11-16").fantome).toBeNull();
  });

  it("une semaine clôturée passe dans « déjà passées »", () => {
    const close = { ...S10, clotureeLe: a("2025-11-16T13:00:00Z") };
    const o = composerOnglet([close], "2025-11-16");
    expect(o.aConfirmer).toBeNull();
    expect(o.passees).toEqual([{ debut: "2025-11-10", etat: "cloturee" }]);
  });

  it("les semaines sans ligne entre la première renseignée et aujourd'hui sont « vides »", () => {
    const S27 = { ...semaineVierge("2025-10-27"), clotureeLe: a("2025-11-02T13:00:00Z") };
    const o = composerOnglet([S27], "2025-11-16");
    expect(o.aConfirmer).toBe("2025-11-10");
    expect(o.passees).toEqual([
      { debut: "2025-11-03", etat: "vide" },
      { debut: "2025-10-27", etat: "cloturee" },
    ]);
  });

  it("plusieurs semaines jamais clôturées : la plus récente en carte pleine, les autres réduites « à confirmer »", () => {
    const S03 = semaineVierge("2025-11-03");
    const o = composerOnglet([S03, S10], "2025-11-16");
    expect(o.aConfirmer).toBe("2025-11-10");
    expect(o.passees).toEqual([{ debut: "2025-11-03", etat: "a_confirmer" }]);
  });

  it("la semaine qui vient de finir se confirme même sans ligne ; une semaine plus ancienne jamais clôturée passe en réduite", () => {
    const o = composerOnglet([S17], "2025-11-25");
    expect(o.aConfirmer).toBe("2025-11-17");
    expect(o.passees).toEqual([]);
    const plusTard = composerOnglet([S17], "2025-12-02");
    expect(plusTard.aConfirmer).toBe("2025-11-24");
    expect(plusTard.passees).toEqual([{ debut: "2025-11-17", etat: "a_confirmer" }]);
  });

  it("une semaine sans ligne plus ancienne que la précédente est « vide »", () => {
    const S03 = { ...semaineVierge("2025-11-03"), clotureeLe: a("2025-11-09T13:00:00Z") };
    const o = composerOnglet([S03], "2025-11-25");
    expect(o.aConfirmer).toBe("2025-11-17");
    expect(o.passees).toEqual([
      { debut: "2025-11-10", etat: "vide" },
      { debut: "2025-11-03", etat: "cloturee" },
    ]);
  });
});
