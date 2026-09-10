import { describe, expect, it } from "vitest";
import { formatJourLong } from "./dates";

describe("formatJourLong", () => {
  it("écrit le jour en français, en toutes lettres", () => {
    expect(formatJourLong(new Date(2026, 10, 15, 12))).toBe("dimanche 15 novembre");
  });
});
