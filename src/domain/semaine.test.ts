import { describe, expect, it } from "vitest";
import {
  cloturer,
  dateDuJour,
  debutSemaineAConfirmer,
  debutSemaineAPreparer,
  dimanchePreparation,
  estNonPrevu,
  etatSemaine,
  jokersAJour,
  RegleViolee,
  rouvrir,
  semaineVierge,
  seuilPrevu,
  sujetAJour,
  valider,
  validerJokers,
  type SemaineInfo,
} from "./semaine";

// Calendrier des maquettes : dimanche 16 novembre, semaine du 17 au 23.
const DIM_16 = "2025-11-16";
const MAR_18 = "2025-11-18";
const DIM_23 = "2025-11-23";
const LUN_24 = "2025-11-24";
const S17 = semaineVierge("2025-11-17");
const a = (iso: string) => new Date(iso);

describe("quelle semaine un dimanche", () => {
  it("le dimanche, on prépare la semaine qui commence demain et on confirme celle qui finit aujourd'hui", () => {
    expect(debutSemaineAPreparer(DIM_16)).toBe("2025-11-17");
    expect(debutSemaineAConfirmer(DIM_16)).toBe("2025-11-10");
  });
  it("en semaine, la semaine courante est celle qui contient demain", () => {
    expect(debutSemaineAPreparer(MAR_18)).toBe("2025-11-17");
    expect(debutSemaineAPreparer("2025-11-17")).toBe("2025-11-17");
  });
  it("une semaine se prépare le dimanche qui précède son lundi", () => {
    expect(dimanchePreparation("2025-11-17")).toBe(DIM_16);
    expect(dateDuJour("2025-11-17", 7)).toBe(DIM_23);
  });
  it("refuse un début qui n'est pas un lundi", () => {
    expect(() => semaineVierge(DIM_16)).toThrow(RegleViolee);
  });
});

describe("les quatre états, déduits", () => {
  it("à préparer le dimanche d'avant, tant que personne n'a validé", () => {
    expect(etatSemaine(S17, DIM_16)).toBe("a_preparer");
  });
  it("en cours dès le lundi même sans validation manuelle, ou dès la validation", () => {
    expect(etatSemaine(S17, "2025-11-17")).toBe("en_cours");
    expect(etatSemaine({ ...S17, valideeLe: a("2025-11-16T15:00:00Z") }, DIM_16)).toBe("en_cours");
  });
  it("à confirmer à partir de son dimanche, et tant qu'elle n'est pas clôturée", () => {
    expect(etatSemaine(S17, DIM_23)).toBe("a_confirmer");
    expect(etatSemaine(S17, "2026-01-04")).toBe("a_confirmer");
  });
  it("clôturée dès que cloturee_le est posé", () => {
    expect(etatSemaine({ ...S17, clotureeLe: a("2025-11-23T13:00:00Z") }, LUN_24)).toBe("cloturee");
  });
});

describe("prévu ou non prévu", () => {
  const validee: SemaineInfo = { ...S17, valideeLe: a("2025-11-16T15:00:00Z") };

  it("prend la validation manuelle comme seuil", () => {
    expect(estNonPrevu(a("2025-11-16T14:00:00Z"), validee)).toBe(false);
    expect(estNonPrevu(a("2025-11-16T15:00:00Z"), validee)).toBe(false);
    expect(estNonPrevu(a("2025-11-16T15:00:01Z"), validee)).toBe(true);
  });
  it("sans validation manuelle, le seuil est le lundi 00:00 à Paris", () => {
    expect(seuilPrevu(S17).toISOString()).toBe("2025-11-16T23:00:00.000Z");
    expect(estNonPrevu(a("2025-11-16T22:59:00Z"), S17)).toBe(false);
    expect(estNonPrevu(a("2025-11-16T23:01:00Z"), S17)).toBe(true);
  });
  it("une pizza ajoutée le dimanche de confirmation à 14 h est non prévue", () => {
    expect(estNonPrevu(a("2025-11-23T13:00:00Z"), validee)).toBe(true);
  });
  it("une validation le lundi matin garde prévu ce qui a été ajouté avant", () => {
    const lundiMatin: SemaineInfo = { ...S17, valideeLe: a("2025-11-17T08:00:00Z") };
    expect(estNonPrevu(a("2025-11-17T07:30:00Z"), lundiMatin)).toBe(false);
  });
});

describe("transitions", () => {
  const maintenant = a("2025-11-23T13:00:00Z");

  it("valider : seulement une semaine à préparer", () => {
    expect(valider(S17, a("2025-11-16T15:00:00Z"), DIM_16)).toEqual({ valideeLe: a("2025-11-16T15:00:00Z") });
    expect(() => valider(S17, maintenant, MAR_18)).toThrow(RegleViolee);
  });
  it("clôturer : à partir du dimanche de la semaine, jamais avant, même jamais validée", () => {
    expect(() => cloturer(S17, maintenant, MAR_18)).toThrow(RegleViolee);
    expect(cloturer(S17, maintenant, DIM_23)).toEqual({ clotureeLe: maintenant });
    expect(cloturer(S17, maintenant, LUN_24)).toEqual({ clotureeLe: maintenant });
  });
  it("clôturer deux fois est refusé ; rouvrir garde la trace et rend modifiable", () => {
    const close = { ...S17, clotureeLe: maintenant };
    expect(() => cloturer(close, maintenant, LUN_24)).toThrow(RegleViolee);
    const reouverte = { ...close, ...rouvrir(close, a("2025-11-24T09:00:00Z")) };
    expect(reouverte.clotureeLe).toBeNull();
    expect(reouverte.rouverteLe).toEqual([a("2025-11-24T09:00:00Z")]);
    expect(etatSemaine(reouverte, LUN_24)).toBe("a_confirmer");
    expect(() => rouvrir(S17, maintenant)).toThrow(RegleViolee);
  });
  it("valider les jokers est refusé sur une semaine clôturée", () => {
    expect(validerJokers(S17, maintenant)).toEqual({ jokersValidesLe: maintenant });
    expect(() => validerJokers({ ...S17, clotureeLe: maintenant }, maintenant)).toThrow(RegleViolee);
  });
});

describe("pastilles de confirmation", () => {
  it("un sujet est à jour s'il a bougé depuis le dimanche 00:00 de la semaine", () => {
    expect(sujetAJour(null, S17)).toBe(false);
    expect(sujetAJour(a("2025-11-18T20:00:00Z"), S17)).toBe(false);
    expect(sujetAJour(a("2025-11-22T23:00:00Z"), S17)).toBe(true);
    expect(sujetAJour(a("2025-11-23T13:00:00Z"), S17)).toBe(true);
  });
  it("les jokers sont à jour par le geste Valider, même sans aucune coche", () => {
    expect(jokersAJour(S17)).toBe(false);
    expect(jokersAJour({ ...S17, jokersValidesLe: a("2025-11-23T13:05:00Z") })).toBe(true);
  });
});
