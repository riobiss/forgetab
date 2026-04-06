import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  getUserIdFromFastifyRequest: vi.fn(),
  grantCharacterXpUseCase: vi.fn(),
  grantCharacterPointsUseCase: vi.fn(),
  buyCharacterSkillUseCase: vi.fn(),
  removeCharacterSkillUseCase: vi.fn(),
  loadCharacterAbilitiesUseCase: vi.fn(),
  addNpcMonsterCharacterAbilityUseCase: vi.fn(),
  removeNpcMonsterCharacterAbilityUseCase: vi.fn(),
  getCharacterInventoryUseCase: vi.fn(),
  removeCharacterInventoryItemApiUseCase: vi.fn(),
  updateCharacterStatusCurrentUseCase: vi.fn(),
  getRpgAccess: vi.fn(),
  listCharacters: vi.fn(),
  createCharacter: vi.fn(),
  canManageCharacter: vi.fn(),
  getCharacterEditorSnapshot: vi.fn(),
  updateCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getUserIdFromFastifyRequest: mocks.getUserIdFromFastifyRequest,
}))

vi.mock("@/application/characterProgression/use-cases/characterProgression", () => ({
  grantCharacterXpUseCase: mocks.grantCharacterXpUseCase,
  grantCharacterPointsUseCase: mocks.grantCharacterPointsUseCase,
}))

vi.mock("@/application/characterAbilities/use-cases/characterSkillPurchase", () => ({
  buyCharacterSkillUseCase: mocks.buyCharacterSkillUseCase,
  removeCharacterSkillUseCase: mocks.removeCharacterSkillUseCase,
}))

vi.mock("@/application/characterAbilities/use-cases/characterAbilities", () => ({
  loadCharacterAbilitiesUseCase: mocks.loadCharacterAbilitiesUseCase,
}))

vi.mock("@/application/characterAbilities/use-cases/npcMonsterCharacterAbilities", () => ({
  addNpcMonsterCharacterAbilityUseCase: mocks.addNpcMonsterCharacterAbilityUseCase,
  removeNpcMonsterCharacterAbilityUseCase: mocks.removeNpcMonsterCharacterAbilityUseCase,
}))

vi.mock("@/application/characterInventory/use-cases/manageCharacterInventory", () => ({
  getCharacterInventoryUseCase: mocks.getCharacterInventoryUseCase,
  removeCharacterInventoryItemApiUseCase: mocks.removeCharacterInventoryItemApiUseCase,
}))

vi.mock("@/application/characterStatusCurrent/use-cases/characterStatusCurrent", () => ({
  updateCharacterStatusCurrentUseCase: mocks.updateCharacterStatusCurrentUseCase,
}))

vi.mock("@/application/characters/use-cases/getRpgAccess", () => ({
  getRpgAccess: mocks.getRpgAccess,
}))

vi.mock("@/application/characters/use-cases/listCharacters", () => ({
  listCharacters: mocks.listCharacters,
}))

vi.mock("@/application/characters/use-cases/createCharacter", () => ({
  createCharacter: mocks.createCharacter,
}))

vi.mock("@/lib/server/characters/manage/permissions", () => ({
  canManageCharacter: mocks.canManageCharacter,
}))

vi.mock("@/lib/server/characters/getCharacterEditorSnapshot", () => ({
  getCharacterEditorSnapshot: mocks.getCharacterEditorSnapshot,
}))

vi.mock("@/application/characters/use-cases/updateCharacter", () => ({
  updateCharacter: mocks.updateCharacter,
}))

vi.mock("@/application/characters/use-cases/deleteCharacter", () => ({
  deleteCharacter: mocks.deleteCharacter,
}))

import { buildApiServer } from "@api/app"

describe("characters routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromFastifyRequest.mockResolvedValue("user-1")
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 401 ao listar personagens sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getUserIdFromFastifyRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/characters",
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 404 quando usuario nao tem acesso ao RPG", async () => {
    server = buildApiServer()
    mocks.getRpgAccess.mockResolvedValue({
      exists: false,
      canAccess: false,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/characters",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 com lista de personagens", async () => {
    server = buildApiServer()
    const access = {
      exists: true,
      canAccess: true,
      isOwner: true,
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      allowMultiplePlayerCharacters: false,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }],
    }
    mocks.getRpgAccess.mockResolvedValue(access)
    mocks.listCharacters.mockResolvedValue({
      characters: [],
      isOwner: true,
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      allowMultiplePlayerCharacters: false,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }],
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/characters",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      characters: [],
      isOwner: true,
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      allowMultiplePlayerCharacters: false,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }],
    })
  })

  it("retorna 201 ao criar personagem", async () => {
    server = buildApiServer()
    const access = { exists: true, canAccess: true }
    const body = { name: "Personagem 2", characterType: "player" }
    mocks.getRpgAccess.mockResolvedValue(access)
    mocks.createCharacter.mockResolvedValue({
      id: "char-1",
      name: "Personagem 2",
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/characters",
      payload: body,
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.createCharacter).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      userId: "user-1",
      access,
      payload: body,
      characterRepository: expect.anything(),
      rpgTemplatesRepository: expect.anything(),
    })
    expect(response.json()).toEqual({
      character: {
        id: "char-1",
        name: "Personagem 2",
      },
    })
  })

  it("retorna 409 quando criacao falha por regra de negocio", async () => {
    server = buildApiServer()
    mocks.getRpgAccess.mockResolvedValue({ exists: true, canAccess: true })
    mocks.createCharacter.mockRejectedValue(
      new AppError("Voce ja possui um personagem player neste RPG.", 409),
    )

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/characters",
      payload: { name: "Personagem 2", characterType: "player" },
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      message: "Voce ja possui um personagem player neste RPG.",
    })
  })

  it("retorna 200 com snapshot do personagem", async () => {
    server = buildApiServer()
    mocks.canManageCharacter.mockResolvedValue({ ok: true })
    mocks.getCharacterEditorSnapshot.mockResolvedValue({
      id: "char-1",
      name: "Goblin",
      characterType: "npc",
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/characters/char-1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      character: {
        id: "char-1",
        name: "Goblin",
        characterType: "npc",
      },
    })
  })

  it("retorna 403 quando nao pode gerenciar personagem", async () => {
    server = buildApiServer()
    mocks.canManageCharacter.mockResolvedValue({
      ok: false,
      message: "Sem permissao para gerenciar personagem.",
      status: 403,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/characters/char-1",
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({
      message: "Sem permissao para gerenciar personagem.",
    })
  })

  it("retorna 200 ao atualizar personagem", async () => {
    server = buildApiServer()
    const payload = { name: "Goblin Rei" }
    mocks.updateCharacter.mockResolvedValue(undefined)
    mocks.getCharacterEditorSnapshot.mockResolvedValue({
      id: "char-1",
      name: "Goblin Rei",
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/characters/char-1",
      payload,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      message: "Personagem atualizado com sucesso.",
      character: {
        id: "char-1",
        name: "Goblin Rei",
      },
    })
  })

  it("retorna 200 ao deletar personagem", async () => {
    server = buildApiServer()
    mocks.deleteCharacter.mockResolvedValue(undefined)

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/characters/char-1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Personagem deletado com sucesso." })
  })

  it("retorna 200 com inventario", async () => {
    server = buildApiServer()
    mocks.getCharacterInventoryUseCase.mockResolvedValue({
      characterName: "Arthas",
      inventory: [],
      isOwner: true,
      useInventoryWeightLimit: false,
      maxCarryWeight: null,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/characters/char-1/inventory",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      characterName: "Arthas",
      inventory: [],
      isOwner: true,
      useInventoryWeightLimit: false,
      maxCarryWeight: null,
    })
  })

  it("retorna 405 ao tentar dar item pela rota antiga de inventario", async () => {
    server = buildApiServer()

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/characters/char-1/inventory",
    })

    expect(response.statusCode).toBe(405)
    expect(response.json()).toEqual({
      message: "Dar item por esta rota foi desativado. Use a pagina de itens do RPG.",
    })
  })

  it("retorna 200 ao remover item do inventario", async () => {
    server = buildApiServer()
    mocks.removeCharacterInventoryItemApiUseCase.mockResolvedValue({
      message: "Item removido do inventario.",
      inventoryItemId: "inv-1",
      removedQuantity: 2,
      remainingQuantity: 0,
    })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/characters/char-1/inventory",
      payload: { inventoryItemId: "inv-1", quantity: 5 },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      message: "Item removido do inventario.",
      inventoryItemId: "inv-1",
      removedQuantity: 2,
      remainingQuantity: 0,
    })
  })

  it("retorna 200 ao salvar status atual", async () => {
    server = buildApiServer()
    mocks.updateCharacterStatusCurrentUseCase.mockResolvedValue({
      message: "Status atual salvo.",
      key: "life",
      value: 6,
      max: 10,
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/characters/char-1/status-current",
      payload: { key: "life", value: 6 },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      message: "Status atual salvo.",
      key: "life",
      value: 6,
      max: 10,
    })
  })

  it("retorna 200 ao conceder XP", async () => {
    server = buildApiServer()
    mocks.grantCharacterXpUseCase.mockResolvedValue({
      success: true,
      progressionCurrent: 105,
      progressionLabel: "Level 2",
      progressionRequired: 100,
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/characters/char-1/grant-xp",
      payload: { amount: 10 },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      success: true,
      progressionCurrent: 105,
      progressionLabel: "Level 2",
      progressionRequired: 100,
    })
  })

  it("retorna 200 ao conceder pontos", async () => {
    server = buildApiServer()
    mocks.grantCharacterPointsUseCase.mockResolvedValue({
      success: true,
      remainingPoints: 11,
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/characters/char-1/grant-points",
      payload: { amount: 3 },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      success: true,
      remainingPoints: 11,
    })
  })

  it("retorna 200 ao comprar habilidade", async () => {
    server = buildApiServer()
    mocks.buyCharacterSkillUseCase.mockResolvedValue({
      status: 200,
      success: true,
      remainingPoints: 3,
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/characters/char-1/buy-skill",
      payload: { skillId: "skill-1", level: 1 },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 200,
      success: true,
      remainingPoints: 3,
    })
  })

  it("retorna 200 ao remover habilidade comprada", async () => {
    server = buildApiServer()
    mocks.removeCharacterSkillUseCase.mockResolvedValue({
      status: 200,
      success: true,
      remainingPoints: 5,
    })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/characters/char-1/buy-skill",
      payload: { skillId: "skill-1", level: 1 },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 200,
      success: true,
      remainingPoints: 5,
    })
  })

  it("retorna 200 com habilidades do personagem", async () => {
    server = buildApiServer()
    mocks.loadCharacterAbilitiesUseCase.mockResolvedValue({
      characterName: "Arthas",
      abilities: [{ id: "ability-1", name: "Golpe Sombrio" }],
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/characters/char-1/abilities",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      characterName: "Arthas",
      abilities: [{ id: "ability-1", name: "Golpe Sombrio" }],
    })
  })

  it("retorna 404 quando habilidades do personagem nao existem", async () => {
    server = buildApiServer()
    mocks.loadCharacterAbilitiesUseCase.mockResolvedValue(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/characters/char-1/abilities",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "Personagem nao encontrado." })
  })

  it("retorna 200 ao adicionar habilidade de npc/monster", async () => {
    server = buildApiServer()
    mocks.addNpcMonsterCharacterAbilityUseCase.mockResolvedValue({
      message: "Habilidade adicionada com sucesso.",
      ability: { id: "ability-1", name: "Mordida" },
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/characters/char-1/abilities",
      payload: { name: "Mordida" },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      message: "Habilidade adicionada com sucesso.",
      ability: { id: "ability-1", name: "Mordida" },
    })
  })

  it("retorna 200 ao remover habilidade de npc/monster", async () => {
    server = buildApiServer()
    mocks.removeNpcMonsterCharacterAbilityUseCase.mockResolvedValue({
      message: "Habilidade removida com sucesso.",
      removedAbilityId: "ability-1",
    })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/characters/char-1/abilities",
      payload: { abilityId: "ability-1" },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      message: "Habilidade removida com sucesso.",
      removedAbilityId: "ability-1",
    })
  })
})
