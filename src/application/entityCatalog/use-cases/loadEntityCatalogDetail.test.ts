import { describe, expect, it, vi } from "vitest"
import type { EntityCatalogDetailAccessService } from "@/application/entityCatalog/ports/EntityCatalogDetailAccessService"
import type { EntityCatalogDetailRepository } from "@/application/entityCatalog/ports/EntityCatalogDetailRepository"
import { loadEntityCatalogDetailUseCase } from "@/application/entityCatalog/use-cases/loadEntityCatalogDetail"

function createRepositoryMock(): EntityCatalogDetailRepository {
  return {
    getClassDetail: vi.fn(),
    getRaceDetail: vi.fn(),
    listAttributeTemplates: vi.fn().mockResolvedValue([]),
    listSkillTemplates: vi.fn().mockResolvedValue([]),
    listClassAbilities: vi.fn().mockResolvedValue([]),
    listRaceAbilities: vi.fn().mockResolvedValue([]),
    listClassPlayers: vi.fn().mockResolvedValue([]),
    listRacePlayers: vi.fn().mockResolvedValue([]),
    getClassPurchaseState: vi.fn(),
    getRacePurchaseState: vi.fn(),
  }
}

function createAccessServiceMock(): EntityCatalogDetailAccessService {
  return {
    getRpgPermission: vi.fn().mockResolvedValue({
      canManage: false,
      isOwner: false,
      isAcceptedMember: false,
    }),
    getMembershipStatus: vi.fn().mockResolvedValue("none"),
  }
}

describe("loadEntityCatalogDetailUseCase", () => {
  it("retorna null quando o template nao existe", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    vi.mocked(repository.getClassDetail).mockResolvedValue(null)

    const result = await loadEntityCatalogDetailUseCase(
      { repository, accessService },
      { rpgId: "rpg-1", classId: "class-1", userId: "user-1", entityType: "class" },
    )

    expect(result).toBeNull()
  })

  it("retorna null quando a entidade privada nao pode ser lida", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    vi.mocked(repository.getRaceDetail).mockResolvedValue({
      entityType: "race",
      id: "race-1",
      key: "elf",
      ownerId: "owner-1",
      visibility: "private",
      costsEnabled: false,
      costResourceName: "Skill Points",
      current: {
        id: "race-1",
        key: "elf",
        label: "Elfo",
        category: "geral",
        shortDescription: null,
        content: { type: "doc", content: [] },
        attributeBonuses: {},
        skillBonuses: {},
        catalogMeta: {
          shortDescription: null,
          richText: { description: { type: "doc", content: [] } },
        },
      },
    })

    const result = await loadEntityCatalogDetailUseCase(
      { repository, accessService },
      { rpgId: "rpg-1", raceKey: "elf", userId: "user-2", entityType: "race" },
    )

    expect(result).toBeNull()
  })

  it("monta o detalhe de classe com permissao e estado de compra", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    vi.mocked(repository.getClassDetail).mockResolvedValue({
      entityType: "class",
      id: "class-1",
      key: "mage",
      ownerId: "owner-1",
      visibility: "public",
      costsEnabled: true,
      costResourceName: "Pontos",
      current: {
        id: "class-1",
        key: "mage",
        label: "Maga",
        category: "arcana",
        shortDescription: "Mestra do mana",
        content: { type: "doc", content: [] },
        attributeBonuses: { int: 2 },
        skillBonuses: { magia: 3 },
        catalogMeta: {
          shortDescription: "Mestra do mana",
          richText: { description: { type: "doc", content: [] } },
        },
      },
    })
    vi.mocked(accessService.getRpgPermission).mockResolvedValue({
      canManage: true,
      isOwner: true,
      isAcceptedMember: true,
    })
    vi.mocked(repository.listAttributeTemplates).mockResolvedValue([{ key: "int", label: "Intelecto" }])
    vi.mocked(repository.listSkillTemplates).mockResolvedValue([{ key: "magia", label: "Magia" }])
    vi.mocked(repository.listClassAbilities).mockResolvedValue([
      {
        skillId: "skill-1",
        skillName: "Bola de Fogo",
        skillDescription: null,
        skillCategory: null,
        skillType: null,
        skillActionType: null,
        skillTags: [],
        levels: [],
      },
    ])
    vi.mocked(repository.listClassPlayers).mockResolvedValue([
      { id: "char-1", name: "Ayla", image: null, classKey: "mage", raceKey: "human" },
    ])
    vi.mocked(repository.getClassPurchaseState).mockResolvedValue({
      characterId: "char-1",
      costsEnabled: true,
      costResourceName: "Pontos",
      initialPoints: 7,
      initialOwnedBySkill: { "skill-1": [1] },
    })

    const result = await loadEntityCatalogDetailUseCase(
      { repository, accessService },
      { rpgId: "rpg-1", classId: "class-1", userId: "owner-1", entityType: "class" },
    )

    expect(result).not.toBeNull()
    expect(result?.canManage).toBe(true)
    expect(result?.current.label).toBe("Maga")
    expect(result?.attributeTemplates).toEqual([{ key: "int", label: "Intelecto" }])
    expect(result?.abilityPurchase.characterId).toBe("char-1")
    expect(repository.listClassPlayers).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      classKey: "mage",
      classId: "class-1",
      userId: "owner-1",
      isOwner: true,
    })
  })

  it("monta o detalhe de raca com fallback sem usuario", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    vi.mocked(repository.getRaceDetail).mockResolvedValue({
      entityType: "race",
      id: "race-1",
      key: "elf",
      ownerId: "owner-1",
      visibility: "public",
      costsEnabled: false,
      costResourceName: "Skill Points",
      current: {
        id: "race-1",
        key: "elf",
        label: "Elfo",
        category: "nobre",
        shortDescription: "Antigos",
        content: { type: "doc", content: [] },
        attributeBonuses: { dex: 2 },
        skillBonuses: {},
        catalogMeta: {
          shortDescription: "Antigos",
          richText: { description: { type: "doc", content: [] } },
        },
        lore: { summary: "Lore" },
      },
    })
    vi.mocked(repository.listRaceAbilities).mockResolvedValue([])
    vi.mocked(repository.listRacePlayers).mockResolvedValue([])

    const result = await loadEntityCatalogDetailUseCase(
      { repository, accessService },
      { rpgId: "rpg-1", raceKey: "elf", userId: null, entityType: "race" },
    )

    expect(result).not.toBeNull()
    expect(result?.canManage).toBe(false)
    expect(result?.current.key).toBe("elf")
    expect(result?.abilityPurchase).toEqual({
      characterId: null,
      costsEnabled: false,
      costResourceName: "Skill Points",
      initialPoints: 0,
      initialOwnedBySkill: {},
    })
    expect(repository.getRacePurchaseState).not.toHaveBeenCalled()
  })
})
