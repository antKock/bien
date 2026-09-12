import { describe, expect, it } from "vitest";
import { memeLibelle, normaliserLibelle } from "./noms";

describe("noms conservés", () => {
  it("nettoie la saisie et met une majuscule initiale", () => {
    expect(normaliserLibelle("  rab   de pâtes ")).toBe("Rab de pâtes");
    expect(normaliserLibelle("")).toBe("");
  });
  it("tronque à quarante caractères", () => {
    expect(normaliserLibelle("a".repeat(50))).toHaveLength(40);
  });
  it("reconnaît un nom déjà noté sans tenir compte de la casse ni des espaces", () => {
    expect(memeLibelle("Rab de pâtes", "rab de  pâtes")).toBe(true);
    expect(memeLibelle("Rab de pâtes", "Rab de riz")).toBe(false);
  });
});
