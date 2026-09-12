import { describe, expect, it } from "vitest";
import { ajouterJours, debutDuJour, estLundi, jourDe, jourSemaine, lundiDe } from "./jours";

describe("jours civils", () => {
  it("lit le jour de Paris, pas celui d'UTC", () => {
    // 23 h 30 UTC un samedi = 00 h 30 dimanche à Paris (hiver).
    expect(jourDe(new Date("2025-11-15T23:30:00Z"))).toBe("2025-11-16");
    // 22 h 30 UTC en été = 00 h 30 le lendemain.
    expect(jourDe(new Date("2026-07-04T22:30:00Z"))).toBe("2026-07-05");
  });

  it("numérote lundi 1 … dimanche 7", () => {
    expect(jourSemaine("2025-11-17")).toBe(1);
    expect(jourSemaine("2025-11-16")).toBe(7);
    expect(estLundi("2025-11-17")).toBe(true);
  });

  it("retrouve le lundi d'un jour, sans changer un lundi", () => {
    expect(lundiDe("2025-11-16")).toBe("2025-11-10");
    expect(lundiDe("2025-11-17")).toBe("2025-11-17");
    expect(lundiDe("2025-11-23")).toBe("2025-11-17");
  });

  it("ajoute des jours à travers les mois et les années", () => {
    expect(ajouterJours("2025-11-30", 1)).toBe("2025-12-01");
    expect(ajouterJours("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("place minuit à Paris, hiver comme été", () => {
    expect(debutDuJour("2025-11-17").toISOString()).toBe("2025-11-16T23:00:00.000Z");
    expect(debutDuJour("2026-07-06").toISOString()).toBe("2026-07-05T22:00:00.000Z");
  });
});
