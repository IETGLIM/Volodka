import { describe, expect, it } from "vitest";
import { distanceXZ, npcProximityBarkText, relationValueForNpc } from "./npcProximityBarks";

describe("npcProximityBarks", () => {
  it("distanceXZ", () => {
    expect(distanceXZ({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
  });

  it("npcProximityBarkText hostile / warm / neutral", () => {
    expect(npcProximityBarkText("Альберт", 20)).toContain("Проваливай");
    expect(npcProximityBarkText("Зарема", 70)).toContain("Привет, герой");
    expect(npcProximityBarkText("Вика", 50)).toContain("Эй, Володька");
  });

  it("relationValueForNpc", () => {
    expect(relationValueForNpc("a", [{ id: "a", value: 12 }])).toBe(12);
    expect(relationValueForNpc("missing", [])).toBe(0);
  });
});
