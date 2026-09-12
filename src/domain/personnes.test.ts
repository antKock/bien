import { describe, expect, it } from "vitest";
import { initiales } from "./personnes";

describe("initiales", () => {
  it("une lettre, deux si les prénoms commencent pareil", () => {
    expect(initiales(["Anthony", "Alice"])).toEqual(["A", "Al"]);
    expect(initiales(["Camille", "Sacha"])).toEqual(["C", "S"]);
  });
});
