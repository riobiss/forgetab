import { describe, expect, it, vi } from "vitest"
import type { SkillsDashboardGateway } from "@/application/skillsDashboard/contracts/SkillsDashboardGateway"
import {
  buildSkillsSearchIndex,
  createSkillLevelSnapshotUseCase,
  createSkillUseCase,
  deleteSkillLevelUseCase,
  deleteSkillUseCase,
  loadDashboardData,
  loadSkillDetail,
  parseSearchIndex,
  updateSkillLevelUseCase,
  updateSkillMetaUseCase,
} from "@/application/skillsDashboard/use-cases/skillsDashboard"

function createGatewayMock(): SkillsDashboardGateway {
  return {
    fetchClasses: vi.fn(),
    fetchRaces: vi.fn(),
    fetchSkills: vi.fn(),
    fetchSkillsSearchIndex: vi.fn(),
    fetchRpgSettings: vi.fn(),
    fetchSkillById: vi.fn(),
    createSkill: vi.fn(),
    updateSkillMeta: vi.fn(),
    createSkillLevelSnapshot: vi.fn(),
    updateSkillLevel: vi.fn(),
    deleteSkillLevel: vi.fn(),
    deleteSkill: vi.fn(),
  }
}

describe("skillsDashboard use-cases", () => {
  it("loadDashboardData agrega dados do gateway", async () => {
    const gateway = createGatewayMock()
    ;(gateway.fetchClasses as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "c1", label: "Mage" }])
    ;(gateway.fetchRaces as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "r1", label: "Elf" }])
    ;(gateway.fetchSkills as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "s1", slug: "fireball", updatedAt: "2026-03-04T00:00:00.000Z" },
    ])
    ;(gateway.fetchRpgSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
      costResourceName: "Mana",
      abilityCategoriesEnabled: true,
      enabledAbilityCategories: ["arcana"],
    })

    const result = await loadDashboardData({ gateway }, { rpgId: "rpg-1" })

    expect(result).toEqual({
      classes: [{ id: "c1", label: "Mage" }],
      races: [{ id: "r1", label: "Elf" }],
      skills: [{ id: "s1", slug: "fireball", updatedAt: "2026-03-04T00:00:00.000Z" }],
      rpgSettings: {
        costResourceName: "Mana",
        abilityCategoriesEnabled: true,
        enabledAbilityCategories: ["arcana"],
      },
    })
    expect(gateway.fetchClasses).toHaveBeenCalledWith("rpg-1")
    expect(gateway.fetchRaces).toHaveBeenCalledWith("rpg-1")
    expect(gateway.fetchSkills).toHaveBeenCalledWith("rpg-1")
    expect(gateway.fetchRpgSettings).toHaveBeenCalledWith("rpg-1")
  })

  it("buildSkillsSearchIndex usa indice batch e aplica fallback para ids ausentes", async () => {
    const gateway = createGatewayMock()
    ;(gateway.fetchSkillsSearchIndex as ReturnType<typeof vi.fn>).mockResolvedValue({
      s1: {
        searchBlob: "fireball explode",
        displayName: "Bola de Fogo",
        filters: {
          categories: ["arcana"],
          types: ["attack"],
          actionTypes: ["action"],
          tags: ["arcane", "void"],
        },
      },
    })

    const index = await buildSkillsSearchIndex(
      { gateway },
      {
        skills: [
          { id: "s1", slug: "fireball", updatedAt: "2026-03-04T00:00:00.000Z" },
          { id: "s2", slug: "ice-shard", updatedAt: "2026-03-04T00:00:00.000Z" },
        ],
      },
    )

    expect(gateway.fetchSkillsSearchIndex).toHaveBeenCalledWith({
      skillIds: ["s1", "s2"],
      rpgId: undefined,
    })
    expect(index.s1.displayName).toBe("Bola de Fogo")
    expect(index.s1.searchBlob).toContain("fireball")
    expect(index.s1.searchBlob).toContain("explode")
    expect(index.s1.filters).toEqual({
      categories: ["arcana"],
      types: ["attack"],
      actionTypes: ["action"],
      tags: ["arcane", "void"],
    })

    expect(index.s2).toEqual({
      searchBlob: "ice-shard",
      displayName: "ice-shard",
      filters: { categories: [], types: [], actionTypes: [], tags: [] },
    })
  })

  it("parseSearchIndex separa os tres mapas usados na UI", () => {
    const parsed = parseSearchIndex({
      s1: {
        searchBlob: "fireball explode",
        displayName: "Bola de Fogo",
        filters: {
          categories: ["arcana"],
          types: ["attack"],
          actionTypes: ["action"],
          tags: ["arcane"],
        },
      },
    })

    expect(parsed).toEqual({
      skillSearchIndex: { s1: "fireball explode" },
      skillDisplayNameById: { s1: "Bola de Fogo" },
      skillFilterMetaById: {
        s1: {
          categories: ["arcana"],
          types: ["attack"],
          actionTypes: ["action"],
          tags: ["arcane"],
        },
      },
    })
  })

  it("delegates read and crud wrappers to gateway with correct params", async () => {
    const gateway = createGatewayMock()
    ;(gateway.fetchSkillById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "s1",
      slug: "fireball",
      tags: [],
      classIds: [],
      raceIds: [],
      levels: [],
    })
    ;(gateway.createSkill as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "s-new",
      slug: "new-skill",
      tags: [],
      classIds: [],
      raceIds: [],
      levels: [],
    })
    ;(gateway.updateSkillMeta as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "s1",
      slug: "fireball",
      tags: ["arcane"],
      classIds: ["c1"],
      raceIds: ["r1"],
      levels: [],
    })
    ;(gateway.createSkillLevelSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "s1",
      slug: "fireball",
      tags: [],
      classIds: [],
      raceIds: [],
      levels: [],
    })
    ;(gateway.updateSkillLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "s1",
      slug: "fireball",
      tags: [],
      classIds: [],
      raceIds: [],
      levels: [],
    })
    ;(gateway.deleteSkillLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "s1",
      slug: "fireball",
      tags: [],
      classIds: [],
      raceIds: [],
      levels: [],
    })
    ;(gateway.deleteSkill as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "s1" })

    await loadSkillDetail({ gateway }, { skillId: "s1" })
    await createSkillUseCase({ gateway }, { payload: { rpgId: "rpg-1" } })
    await updateSkillMetaUseCase({ gateway }, { skillId: "s1", payload: { tags: ["arcane"] } })
    await createSkillLevelSnapshotUseCase({ gateway }, { skillId: "s1" })
    await updateSkillLevelUseCase({
      gateway,
    }, {
      skillId: "s1",
      levelId: "l1",
      payload: {
        levelRequired: 1,
        summary: null,
        stats: {},
        cost: {},
        requirement: {},
      },
    })
    await deleteSkillLevelUseCase({ gateway }, { skillId: "s1", levelId: "l1" })
    await deleteSkillUseCase({ gateway }, { skillId: "s1" })

    expect(gateway.fetchSkillById).toHaveBeenCalledWith("s1")
    expect(gateway.createSkill).toHaveBeenCalledWith({ rpgId: "rpg-1" })
    expect(gateway.updateSkillMeta).toHaveBeenCalledWith("s1", { tags: ["arcane"] })
    expect(gateway.createSkillLevelSnapshot).toHaveBeenCalledWith("s1")
    expect(gateway.updateSkillLevel).toHaveBeenCalledWith("s1", "l1", {
      levelRequired: 1,
      summary: null,
      stats: {},
      cost: {},
      requirement: {},
    })
    expect(gateway.deleteSkillLevel).toHaveBeenCalledWith("s1", "l1")
    expect(gateway.deleteSkill).toHaveBeenCalledWith("s1")
  })
})
