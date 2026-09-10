import { describe, expect, it } from "vitest";
import { codeComplet, normaliserCode } from "./code-foyer";

describe("normaliserCode", () => {
  it("met en majuscules et ignore espaces, tirets et caractères hors alphabet", () => {
    expect(normaliserCode(" k7m-4q z ")).toBe("K7M4QZ");
    expect(normaliserCode("k7m4qz")).toBe("K7M4QZ");
  });
  it("tronque à six caractères", () => {
    expect(normaliserCode("ABCDEFGH")).toBe("ABCDEF");
  });
});

describe("codeComplet", () => {
  it("n'accepte qu'un code de six caractères déjà normalisé", () => {
    expect(codeComplet("K7M4QZ")).toBe(true);
    expect(codeComplet("K7M4Q")).toBe(false);
    expect(codeComplet("k7m4qz")).toBe(false);
  });
});
