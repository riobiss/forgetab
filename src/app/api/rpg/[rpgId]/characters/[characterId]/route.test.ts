import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock("@/lib/auth/token", () => ({
  TOKEN_COOKIE_NAME: "auth_token",
  verifyAuthToken: mocks.verifyAuthToken,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}))

import { DELETE, GET, PATCH } from "./route"

function makeRequest(
  method: "GET" | "PATCH" | "DELETE",
  body?: unknown,
  withAuth = true,
) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/characters/char-1", {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(withAuth ? { cookie: "auth_token=test-token" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(rpgId = "rpg-1", characterId = "char-1") {
  return { params: Promise.resolve({ rpgId, characterId }) }
}

describe("GET /api/rpg/[rpgId]/characters/[characterId]", () => {
  beforeEach(() => {
    mocks.queryRaw.mockReset()
    mocks.verifyAuthToken.mockReset()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
  })

  it("retorna 200 com o snapshot completo do npc para edicao", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "rpg-1",
        ownerId: "user-1",
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        name: "Goblin",
        characterType: "npc",
        createdByUserId: null,
        skills: {},
        currentStatuses: {},
        identity: { nome: "Goblin", "titulo-apelido": "Ladrao" },
        characteristics: { descricao: "Pequeno e agil" },
        progressionCurrent: 0,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        name: "Goblin",
        image: null,
        raceKey: null,
        classKey: null,
        characterType: "npc",
        visibility: "public",
        maxCarryWeight: null,
        progressionMode: "xp_level",
        progressionLabel: "Level 1",
        progressionRequired: 0,
        progressionCurrent: 0,
        createdByUserId: null,
        life: 0,
        defense: 0,
        mana: 0,
        exhaustion: 0,
        sanity: 0,
        statuses: {},
        currentStatuses: {},
        attributes: {},
        skills: {},
        identity: { nome: "Goblin", "titulo-apelido": "Ladrao" },
        characteristics: { descricao: "Pequeno e agil" },
        createdAt: new Date("2026-03-13T00:00:00.000Z"),
        updatedAt: new Date("2026-03-13T00:00:00.000Z"),
      },
    ])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      character: {
        id: "char-1",
        rpgId: "rpg-1",
        name: "Goblin",
        image: null,
        raceKey: null,
        classKey: null,
        characterType: "npc",
        visibility: "public",
        maxCarryWeight: null,
        progressionMode: "xp_level",
        progressionLabel: "Level 1",
        progressionRequired: 0,
        progressionCurrent: 0,
        createdByUserId: null,
        life: 0,
        defense: 0,
        mana: 0,
        exhaustion: 0,
        sanity: 0,
        statuses: {},
        currentStatuses: {},
        attributes: {},
        skills: {},
        identity: { nome: "Goblin", "titulo-apelido": "Ladrao" },
        characteristics: { descricao: "Pequeno e agil" },
        createdAt: "2026-03-13T00:00:00.000Z",
        updatedAt: "2026-03-13T00:00:00.000Z",
      },
    })
  })
})

describe("PATCH /api/rpg/[rpgId]/characters/[characterId]", () => {
  beforeEach(() => {
    mocks.queryRaw.mockReset()
    mocks.verifyAuthToken.mockReset()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await PATCH(
      makeRequest("PATCH", { name: "Heroi" }, false),
      makeContext(),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 403 quando jogador comum tenta definir raca/classe via edicao", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "rpg-1",
        ownerId: "owner-1",
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        status: "accepted",
        role: "member",
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        characterType: "player",
        createdByUserId: "user-1",
        skills: {},
        currentStatuses: {},
        identity: {},
        characteristics: {},
        progressionCurrent: 0,
      },
    ])

    const response = await PATCH(
      makeRequest("PATCH", { name: "Heroi", raceKey: "human" }),
      makeContext(),
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      message: "Somente mestre ou moderador podem editar raca e classe de personagens.",
    })
  })

  it("retorna 200 ao atualizar npc com patch basico", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "rpg-1",
        ownerId: "user-1",
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        name: "Goblin",
        characterType: "npc",
        createdByUserId: null,
        skills: {},
        currentStatuses: {},
        identity: {},
        characteristics: {},
        progressionCurrent: 0,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "char-1" }])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        name: "Goblin Rei",
        image: null,
        raceKey: null,
        classKey: null,
        characterType: "npc",
        visibility: "public",
        maxCarryWeight: null,
        progressionMode: "xp_level",
        progressionLabel: "Level 1",
        progressionRequired: 0,
        progressionCurrent: 0,
        createdByUserId: null,
        life: 0,
        defense: 0,
        mana: 0,
        exhaustion: 0,
        sanity: 0,
        statuses: {},
        currentStatuses: {},
        attributes: {},
        skills: {},
        identity: { nome: "Goblin Rei", "titulo-apelido": "Chefe" },
        characteristics: { descricao: "Novo lider" },
        createdAt: new Date("2026-03-13T00:00:00.000Z"),
        updatedAt: new Date("2026-03-13T00:00:00.000Z"),
      },
    ])

    const response = await PATCH(
      makeRequest("PATCH", {
        name: "Goblin Rei",
        visibility: "public",
        identity: { nome: "Goblin Rei", "titulo-apelido": "Chefe" },
        characteristics: { descricao: "Novo lider" },
      }),
      makeContext(),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      message: "Personagem atualizado com sucesso.",
      character: {
        id: "char-1",
        rpgId: "rpg-1",
        name: "Goblin Rei",
        image: null,
        raceKey: null,
        classKey: null,
        characterType: "npc",
        visibility: "public",
        maxCarryWeight: null,
        progressionMode: "xp_level",
        progressionLabel: "Level 1",
        progressionRequired: 0,
        progressionCurrent: 0,
        createdByUserId: null,
        life: 0,
        defense: 0,
        mana: 0,
        exhaustion: 0,
        sanity: 0,
        statuses: {},
        currentStatuses: {},
        attributes: {},
        skills: {},
        identity: { nome: "Goblin Rei", "titulo-apelido": "Chefe" },
        characteristics: { descricao: "Novo lider" },
        createdAt: "2026-03-13T00:00:00.000Z",
        updatedAt: "2026-03-13T00:00:00.000Z",
      },
    })
  })
})

describe("DELETE /api/rpg/[rpgId]/characters/[characterId]", () => {
  beforeEach(() => {
    mocks.queryRaw.mockReset()
    mocks.verifyAuthToken.mockReset()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
  })

  it("retorna 200 quando deleta personagem com sucesso", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "rpg-1",
        ownerId: "user-1",
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        characterType: "player",
        createdByUserId: null,
        skills: {},
        currentStatuses: {},
        identity: {},
        characteristics: {},
        progressionCurrent: 0,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ image: null }])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "char-1" }])

    const response = await DELETE(makeRequest("DELETE"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ message: "Personagem deletado com sucesso." })
  })
})
