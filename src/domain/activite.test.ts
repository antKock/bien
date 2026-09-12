import { describe, expect, it } from "vitest";
import { prochaineSeance, resumeActivite, seancesACreer } from "./activite";

const COURSE = { activite: "course", nomId: null, jour: 3, creneau: "soir" } as const;

describe("ajouter une séance (écran 10)", () => {
  it("« les deux » crée deux séances distinctes, identiques par ailleurs", () => {
    const s = seancesACreer(["p1", "p2"], COURSE, false);
    expect(s).toHaveLength(2);
    expect(s.map((x) => x.personneId)).toEqual(["p1", "p2"]);
    expect(s[0]).toMatchObject({ activite: "course", jour: 3, creneau: "soir", faite: false });
  });
  it("après validation, une séance ajoutée naît faite", () => {
    expect(seancesACreer(["p1"], COURSE, true)[0].faite).toBe(true);
  });
  it("« autre » exige un nom, les autres n'en ont pas", () => {
    expect(() => seancesACreer(["p1"], { ...COURSE, activite: "autre" }, false)).toThrow(RangeError);
    expect(() => seancesACreer(["p1"], { ...COURSE, nomId: "n" }, false)).toThrow(RangeError);
    expect(seancesACreer(["p1"], { ...COURSE, activite: "autre", nomId: "n" }, false)[0].nomId).toBe("n");
  });
  it("refuse un jour hors de la semaine", () => {
    expect(() => seancesACreer(["p1"], { ...COURSE, jour: 8 }, false)).toThrow(RangeError);
  });
});

describe("résumé", () => {
  const seances = [
    ...seancesACreer(["p1"], COURSE, true),
    ...seancesACreer(["p2"], { ...COURSE, activite: "pilates", jour: 6, creneau: "matin" }, false),
  ];
  it("« 1 faite sur 2 »", () => {
    expect(resumeActivite(seances)).toEqual({ posees: 2, faites: 1 });
  });
  it("« la prochaine mercredi » : la première séance à partir d'aujourd'hui", () => {
    expect(prochaineSeance(seances, 2)).toBe(3);
    expect(prochaineSeance(seances, 4)).toBe(6);
    expect(prochaineSeance(seances, 7)).toBeNull();
  });
});
