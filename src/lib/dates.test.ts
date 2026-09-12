import { describe, expect, it } from "vitest";
import { formatJourLong, jourAvecNom, jourCourt, nomDuJour, nomSemaine, numeroDuJour } from "./dates";

describe("formats de dates", () => {
  it("écrit le jour en français, en toutes lettres", () => {
    expect(formatJourLong(new Date(2026, 10, 15, 12))).toBe("dimanche 15 novembre");
  });

  it("nomme une semaine sans mois, avec le mois si elle en change ou si on le demande", () => {
    expect(nomSemaine("2025-11-17")).toBe("du 17 au 23");
    expect(nomSemaine("2025-11-10", true)).toBe("du 10 au 16 nov.");
    expect(nomSemaine("2025-09-29")).toBe("du 29 sept. au 5 oct.");
    expect(nomSemaine("2025-12-01")).toBe("du 1ᵉʳ au 7");
  });

  it("écrit un jour seul, court, ou avec son nom", () => {
    expect(numeroDuJour("2025-11-01", true)).toBe("1ᵉʳ nov.");
    expect(jourCourt("2025-11-09")).toBe("9 nov");
    expect(jourAvecNom("2025-11-16")).toBe("dimanche 16");
    expect(nomDuJour(3)).toBe("mercredi");
  });
});
