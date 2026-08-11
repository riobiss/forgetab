import { describe, expect, it, vi } from "vitest"
import type { EntityCatalogDetailAccessService } from "@/features/world/catalog/application/ports/EntityCatalogDetailAccessService"
import type { EntityCatalogDetailRepository } from "@/features/world/catalog/application/ports/EntityCatalogDetailRepository"
import type { EntityCatalogAbilityRepository } from "@/features/world/catalog/application/ports/EntityCatalogAbilityRepository"
import type { EntityCatalogPlayerRepository } from "@/features/world/catalog/application/ports/EntityCatalogPlayerRepository"
import type { EntityCatalogPurchaseRepository } from "@/features/world/catalog/application/ports/EntityCatalogPurchaseRepository"
import type { EntityCatalogCharacterProgressionRepository } from "@/features/world/catalog/application/ports/EntityCatalogCharacterProgressionRepository"
import { loadEntityCatalogDetailUseCase } from "@/features/world/catalog/application/use-cases/loadEntityCatalogDetail"

type RepositoryMock = EntityCatalogDetailRepository &
  EntityCatalogAbilityRepository &
  EntityCatalogPlayerRepository &
  EntityCatalogPurchaseRepository &
  EntityCatalogCharacterProgressionRepository

function createRepositoryMock(): RepositoryMock {
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
    listOwnedClassProgressions: vi.fn().mockResolvedValue([]),
    listOwnedRaceProgressions: vi.fn().mockResolvedValue([])
  }
}

function createDependencies(
  repository: RepositoryMock,
  accessService: EntityCatalogDetailAccessService
) {
  return {
    repository,
    abilityRepository: repository,
    playerRepository: repository,
    purchaseRepository: repository,
    characterProgressionRepository: repository,
    accessService
  }
}

function createAccessServiceMock(): EntityCatalogDetailAccessService {
  return {
    getAccess: vi.fn().mockResolvedValue({
      canManage: false,
      isAcceptedMember: false
    })
  }
}

describe("loadEntityCatalogDetailUseCase", () => {
  it("retorna null quando o template nao existe", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    vi.mocked(repository.getClassDetail).mockResolvedValue(null)

    const result = await loadEntityCatalogDetailUseCase(
      createDependencies(repository, accessService),
      {
        rpgId: "rpg-1",
        classId: "class-1",
        userId: "user-1",
        entityType: "class"
      }
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
        attributeBonuses: {},
        skillBonuses: {},
        catalogMeta: {
          shortDescription: null,
          richText: { description: { type: "doc", content: [] } }
        }
      }
    })

    const result = await loadEntityCatalogDetailUseCase(
      createDependencies(repository, accessService),
      { rpgId: "rpg-1", raceKey: "elf", userId: "user-2", entityType: "race" }
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
        attributeBonuses: { int: 2 },
        skillBonuses: { magia: 3 },
        catalogMeta: {
          shortDescription: "Mestra do mana",
          richText: { description: { type: "doc", content: [] } }
        }
      }
    })
    vi.mocked(accessService.getAccess).mockResolvedValue({
      canManage: true,
      isAcceptedMember: true
    })
    vi.mocked(repository.listAttributeTemplates).mockResolvedValue([
      { key: "int", label: "Intelecto" }
    ])
    vi.mocked(repository.listSkillTemplates).mockResolvedValue([
      { key: "magia", label: "Magia" }
    ])
    vi.mocked(repository.listClassAbilities).mockResolvedValue([
      {
        skillId: "skill-1",
        skillName: "Bola de Fogo",
        skillDescription: null,
        skillCategory: null,
        skillType: null,
        skillActionType: null,
        skillTags: [],
        levels: []
      }
    ])
    vi.mocked(repository.listClassPlayers).mockResolvedValue([
      {
        id: "char-1",
        name: "Ayla",
        image: null,
        classKey: "mage",
        raceKey: "human"
      }
    ])
    vi.mocked(repository.getClassPurchaseState).mockResolvedValue({
      characterId: "char-1",
      costsEnabled: true,
      costResourceName: "Pontos",
      initialPoints: 7,
      initialOwnedBySkill: { "skill-1": [1] }
    })

    const result = await loadEntityCatalogDetailUseCase(
      createDependencies(repository, accessService),
      {
        rpgId: "rpg-1",
        classId: "class-1",
        userId: "owner-1",
        entityType: "class"
      }
    )

    expect(result).not.toBeNull()
    expect(result?.canManage).toBe(true)
    expect(result?.current.label).toBe("Maga")
    expect(result?.attributeTemplates).toEqual([
      { key: "int", label: "Intelecto" }
    ])
    expect(result?.abilityPurchase.characterId).toBe("char-1")
    expect(repository.listClassPlayers).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      classKey: "mage",
      classId: "class-1",
      userId: "owner-1",
      isOwner: true
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
        attributeBonuses: { dex: 2 },
        skillBonuses: {},
        catalogMeta: {
          shortDescription: "Antigos",
          richText: { description: { type: "doc", content: [] } }
        },
        lore: { summary: "Lore" }
      }
    })
    vi.mocked(repository.listRaceAbilities).mockResolvedValue([])
    vi.mocked(repository.listRacePlayers).mockResolvedValue([])

    const result = await loadEntityCatalogDetailUseCase(
      createDependencies(repository, accessService),
      { rpgId: "rpg-1", raceKey: "elf", userId: null, entityType: "race" }
    )

    expect(result).not.toBeNull()
    expect(result?.canManage).toBe(false)
    expect(result?.current.key).toBe("elf")
    expect(result?.abilityPurchase).toEqual({
      characterId: null,
      costsEnabled: false,
      costResourceName: "Skill Points",
      initialPoints: 0,
      initialOwnedBySkill: {}
    })
    expect(repository.getRacePurchaseState).not.toHaveBeenCalled()
    expect(repository.listOwnedRaceProgressions).not.toHaveBeenCalled()
  })

  it("limita habilidades de classe ao nivel do personagem do usuario", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    vi.mocked(repository.getClassDetail).mockResolvedValue({
      entityType: "class",
      id: "class-1",
      key: "mage",
      ownerId: "owner-1",
      visibility: "public",
      costsEnabled: false,
      costResourceName: "Pontos",
      current: {
        id: "class-1",
        key: "mage",
        label: "Maga",
        category: "arcana",
        attributeBonuses: {},
        skillBonuses: {},
        catalogMeta: { shortDescription: null, richText: {} }
      }
    })
    vi.mocked(repository.listClassAbilities).mockResolvedValue([
      createAbility("skill-1", [1, 3, 4]),
      createAbility("skill-2", [4])
    ])
    vi.mocked(repository.getClassPurchaseState).mockResolvedValue(
      createEmptyPurchaseState()
    )
    vi.mocked(repository.listOwnedClassProgressions).mockResolvedValue([
      {
        progressionMode: "xp_level",
        progressionTiers: [
          { label: "Level 1", required: 0 },
          { label: "Level 2", required: 100 },
          { label: "Level 3", required: 300 },
          { label: "Level 4", required: 600 }
        ],
        progressionCurrent: 350
      }
    ])

    const result = await loadEntityCatalogDetailUseCase(
      createDependencies(repository, accessService),
      {
        rpgId: "rpg-1",
        classId: "class-1",
        userId: "user-1",
        entityType: "class"
      }
    )

    expect(result?.abilities).toHaveLength(1)
    expect(
      result?.abilities[0]?.levels.map((level) => level.levelRequired)
    ).toEqual([1, 3])
    expect(repository.listOwnedClassProgressions).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      userId: "user-1",
      classKey: "mage",
      classId: "class-1"
    })
  })

  it("mostra somente habilidades de requisito 1 sem personagem da raca", async () => {
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
        attributeBonuses: {},
        skillBonuses: {},
        catalogMeta: { shortDescription: null, richText: {} }
      }
    })
    vi.mocked(repository.listRaceAbilities).mockResolvedValue([
      createAbility("skill-1", [1, 2]),
      createAbility("skill-2", [2])
    ])
    vi.mocked(repository.getRacePurchaseState).mockResolvedValue(
      createEmptyPurchaseState()
    )

    const result = await loadEntityCatalogDetailUseCase(
      createDependencies(repository, accessService),
      {
        rpgId: "rpg-1",
        raceKey: "elf",
        userId: "user-1",
        entityType: "race"
      }
    )

    expect(result?.abilities).toHaveLength(1)
    expect(result?.abilities[0]?.levels).toHaveLength(1)
    expect(result?.abilities[0]?.levels[0]?.levelRequired).toBe(1)
    expect(repository.listOwnedRaceProgressions).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      userId: "user-1",
      raceKey: "elf"
    })
  })
})

function createEmptyPurchaseState() {
  return {
    characterId: null,
    costsEnabled: false,
    costResourceName: "Skill Points",
    initialPoints: 0,
    initialOwnedBySkill: {}
  }
}

function createAbility(skillId: string, requiredLevels: number[]) {
  return {
    skillId,
    skillName: skillId,
    skillDescription: null,
    skillCategory: null,
    skillType: null,
    skillActionType: null,
    skillTags: [],
    levels: requiredLevels.map((levelRequired, index) => ({
      levelNumber: index + 1,
      levelRequired,
      levelCategory: null,
      levelType: null,
      levelActionType: null,
      levelName: null,
      levelDescription: null,
      notesList: [],
      customFields: [],
      description: null,
      summary: null,
      damage: null,
      range: null,
      cooldown: null,
      duration: null,
      castTime: null,
      resourceCost: null,
      pointsCost: null,
      costCustom: null
    }))
  }
}
