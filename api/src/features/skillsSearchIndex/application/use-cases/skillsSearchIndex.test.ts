import { describe, expect, it, vi } from "vitest"
import {
  buildSkillSearchIndex,
  loadSkillsSearchIndexUseCase,
  normalizeSkillSearchIndexParams,
} from "@/application/skillsSearchIndex/use-cases/skillsSearchIndex"

describe("skillsSearchIndex", () => {
  it("normaliza ids e rpgId", () => {
    expect(
      normalizeSkillSearchIndexParams({
        skillIds: ["s1", "", "s1", 1],
        rpgId: "r1",
      }),
    ).toEqual({
      skillIds: ["s1"],
      rpgId: "r1",
    })
  })

  it("monta indice agregado", () => {
    const index = buildSkillSearchIndex([
      {
        skillId: "s1",
        slug: "fireball",
        tags: ["arcane"],
        levelNumber: 1,
        stats: {
          name: "Bola de Fogo",
          description: "Explode",
          category: "arcana",
          type: "attack",
          actionType: "action",
        },
      },
    ])

    expect(index.s1.displayName).toBe("Bola de Fogo")
    expect(index.s1.filters).toEqual({
      categories: ["arcana"],
      types: ["attack"],
      actionTypes: ["action"],
      tags: ["arcane"],
    })
  })

  it("delegates repository loading", async () => {
    const repository = {
      listSkillRows: vi.fn().mockResolvedValue([]),
    }

    await loadSkillsSearchIndexUseCase(
      { repository },
      { userId: "u1", skillIds: ["s1"], rpgId: "r1" },
    )

    expect(repository.listSkillRows).toHaveBeenCalledWith({
      userId: "u1",
      skillIds: ["s1"],
      rpgId: "r1",
    })
  })
})
