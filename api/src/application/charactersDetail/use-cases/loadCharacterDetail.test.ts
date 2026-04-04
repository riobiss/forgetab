import { describe, expect, it, vi } from "vitest"
import { loadCharacterDetailUseCase } from "@/application/charactersDetail/use-cases/loadCharacterDetail"
import type { CharacterDetailRepository } from "@/application/charactersDetail/ports/CharacterDetailRepository"
import type { CharacterDetailPermissionService } from "@/application/charactersDetail/ports/CharacterDetailPermissionService"
import type { RpgAccessRepository } from "@/application/characters/ports/RpgAccessRepository"

function createRepositoryMock(): CharacterDetailRepository {
  return {
    getRpg: vi.fn(),
    getCharacter: vi.fn(),
    listSkillLabels: vi.fn(),
    listStatusLabels: vi.fn(),
    listIdentityFields: vi.fn(),
    listCharacteristicFields: vi.fn(),
    listAttributeLabels: vi.fn(),
    listRaceLabels: vi.fn(),
    listClassLabels: vi.fn(),
  }
}

describe("loadCharacterDetailUseCase", () => {
  it("retorna not_found quando o RPG nao existe", async () => {
    const repository = createRepositoryMock()
    const rpgAccessRepository: RpgAccessRepository = {
      getRpgAccessRow: vi.fn(),
      getMembership: vi.fn(),
    }
    const permissionService: CharacterDetailPermissionService = {
      getRpgPermission: vi.fn(),
    }

    vi.mocked(repository.getRpg).mockResolvedValue(null)

    const result = await loadCharacterDetailUseCase(
      { repository, rpgAccessRepository, permissionService },
      { rpgId: "rpg-1", characterId: "char-1", userId: "user-1" },
    )

    expect(result).toEqual({ status: "not_found" })
  })

  it("retorna private_blocked quando o viewer nao tem acesso", async () => {
    const repository = createRepositoryMock()
    const rpgAccessRepository: RpgAccessRepository = {
      getRpgAccessRow: vi.fn(),
      getMembership: vi.fn(),
    }
    const permissionService: CharacterDetailPermissionService = {
      getRpgPermission: vi.fn(),
    }

    vi.mocked(repository.getRpg).mockResolvedValue({
      id: "rpg-1",
      ownerId: "owner-1",
      visibility: "private",
      usersCanManageOwnXp: true,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }],
    })
    vi.mocked(permissionService.getRpgPermission).mockResolvedValue({
      isOwner: false,
      canManage: false,
    })
    vi.mocked(rpgAccessRepository.getMembership).mockResolvedValue({
      status: "pending",
      role: "player",
    })

    const result = await loadCharacterDetailUseCase(
      { repository, rpgAccessRepository, permissionService },
      { rpgId: "rpg-1", characterId: "char-1", userId: "user-1" },
    )

    expect(result).toEqual({ status: "private_blocked" })
  })

  it("monta o view model do detalhe", async () => {
    const repository = createRepositoryMock()
    const rpgAccessRepository: RpgAccessRepository = {
      getRpgAccessRow: vi.fn(),
      getMembership: vi.fn(),
    }
    const permissionService: CharacterDetailPermissionService = {
      getRpgPermission: vi.fn(),
    }

    vi.mocked(repository.getRpg).mockResolvedValue({
      id: "rpg-1",
      ownerId: "owner-1",
      visibility: "public",
      usersCanManageOwnXp: true,
      progressionMode: "xp_level",
      progressionTiers: [
        { label: "Level 1", required: 0 },
        { label: "Level 2", required: 100 },
      ],
    })
    vi.mocked(permissionService.getRpgPermission).mockResolvedValue({
      isOwner: false,
      canManage: false,
    })
    vi.mocked(rpgAccessRepository.getMembership).mockResolvedValue({
      status: "accepted",
      role: "player",
    })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      name: "Arthas",
      image: null,
      raceKey: "human",
      classKey: "paladin",
      skillPoints: 3,
      costResourceName: "Skill Points",
      characterType: "player",
      visibility: "public",
      progressionMode: "xp_level",
      progressionLabel: "Level 1",
      progressionRequired: 0,
      progressionCurrent: 40,
      createdByUserId: "user-1",
      life: 10,
      defense: 2,
      mana: 5,
      exhaustion: 1,
      sanity: 8,
      statuses: { life: 10, mana: 5, sanity: 8, exhaustion: 4 },
      currentStatuses: { life: 10, mana: 4, sanity: 8, exhaustion: 1 },
      attributes: { strength: 7 },
      skills: { athletics: 2 },
      identity: { nome: "Arthas", sobrenome: "Menethil" },
      characteristics: { title: "Prince" },
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    vi.mocked(repository.listSkillLabels).mockResolvedValue([
      { key: "athletics", label: "Atletismo" },
    ])
    vi.mocked(repository.listStatusLabels).mockResolvedValue([
      { key: "life", label: "Vida" },
      { key: "mana", label: "Mana" },
      { key: "sanity", label: "Sanidade" },
      { key: "exhaustion", label: "Exaustao" },
    ])
    vi.mocked(repository.listIdentityFields).mockResolvedValue([
      { key: "nome", label: "Nome", position: 1 },
    ])
    vi.mocked(repository.listCharacteristicFields).mockResolvedValue([
      { key: "title", label: "Titulo", position: 1 },
    ])
    vi.mocked(repository.listAttributeLabels).mockResolvedValue([
      { key: "strength", label: "Forca" },
    ])
    vi.mocked(repository.listRaceLabels).mockResolvedValue([
      { key: "human", label: "Humano" },
    ])
    vi.mocked(repository.listClassLabels).mockResolvedValue([
      { id: "class-1", key: "paladin", label: "Paladino" },
    ])

    const result = await loadCharacterDetailUseCase(
      { repository, rpgAccessRepository, permissionService },
      { rpgId: "rpg-1", characterId: "char-1", userId: "user-1" },
    )

    expect(result.status).toBe("ok")
    if (result.status !== "ok") {
      return
    }

    expect(result.data.displayName).toBe("Arthas Menethil")
    expect(result.data.canEditCharacter).toBe(true)
    expect(result.data.attributeEntries).toEqual([
      { key: "strength", label: "Forca", value: 7 },
    ])
    expect(result.data.skillEntries).toEqual([
      { key: "athletics", label: "Atletismo", value: 2 },
    ])
    expect(result.data.identityItems.some((item) => item.label === "Raca")).toBe(true)
    expect(result.data.nextProgressionTierText).toBe("Level 2 (100)")
  })

  it("mascara campos secretos de npc para outros membros", async () => {
    const repository = createRepositoryMock()
    const rpgAccessRepository: RpgAccessRepository = {
      getRpgAccessRow: vi.fn(),
      getMembership: vi.fn(),
    }
    const permissionService: CharacterDetailPermissionService = {
      getRpgPermission: vi.fn(),
    }

    vi.mocked(repository.getRpg).mockResolvedValue({
      id: "rpg-1",
      ownerId: "owner-1",
      visibility: "public",
      usersCanManageOwnXp: true,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }],
    })
    vi.mocked(permissionService.getRpgPermission).mockResolvedValue({
      isOwner: false,
      canManage: false,
    })
    vi.mocked(rpgAccessRepository.getMembership).mockResolvedValue({
      status: "accepted",
      role: "player",
    })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      name: "Esfinge",
      image: null,
      raceKey: null,
      classKey: null,
      skillPoints: 0,
      costResourceName: "Skill Points",
      characterType: "npc",
      visibility: "public",
      progressionMode: "xp_level",
      progressionLabel: "Level 1",
      progressionRequired: 0,
      progressionCurrent: 0,
      createdByUserId: "owner-1",
      life: 10,
      defense: 2,
      mana: 5,
      exhaustion: 1,
      sanity: 8,
      statuses: { life: 10, mana: 5, sanity: 8, exhaustion: 4 },
      currentStatuses: { life: 10, mana: 4, sanity: 8, exhaustion: 1 },
      attributes: {},
      skills: {},
      identity: {
        nome: "Esfinge",
        "titulo-apelido": "Ancestral",
        "classe-livre": "Guardia",
      },
      characteristics: {
        descricao: "Guarda os portoes",
        "status-narrativo": "secreto",
        "campos-secretos": JSON.stringify(["name", "classLabel", "description"]),
      },
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    vi.mocked(repository.listSkillLabels).mockResolvedValue([])
    vi.mocked(repository.listStatusLabels).mockResolvedValue([
      { key: "life", label: "Vida" },
      { key: "mana", label: "Mana" },
      { key: "sanity", label: "Sanidade" },
      { key: "exhaustion", label: "Exaustao" },
    ])
    vi.mocked(repository.listIdentityFields).mockResolvedValue([])
    vi.mocked(repository.listCharacteristicFields).mockResolvedValue([])
    vi.mocked(repository.listAttributeLabels).mockResolvedValue([])
    vi.mocked(repository.listRaceLabels).mockResolvedValue([])
    vi.mocked(repository.listClassLabels).mockResolvedValue([])

    const result = await loadCharacterDetailUseCase(
      { repository, rpgAccessRepository, permissionService },
      { rpgId: "rpg-1", characterId: "char-1", userId: "user-2" },
    )

    expect(result.status).toBe("ok")
    if (result.status !== "ok") {
      return
    }

    expect(result.data.displayName).not.toBe("Esfinge")
    expect(result.data.displayName).not.toMatch(/[A-Za-z]/)
    expect(result.data.identityItems.find((item) => item.label === "Classe")?.value).not.toBe("Guardia")
    expect(result.data.aboutText).not.toBe("Guarda os portoes")
    expect(result.data.characteristicsItems.find((item) => item.label === "Sobre")).toBeUndefined()
  })
})
