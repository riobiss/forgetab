import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  getRpgPermission: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  rpgUpdateMany: vi.fn(),
  rpgDeleteMany: vi.fn(),
}))

vi.mock("@/presentation/api/shared/requestAuth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/lib/server/rpgPermissions", () => ({
  getRpgPermission: mocks.getRpgPermission,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
    $executeRaw: mocks.executeRaw,
    rpg: {
      updateMany: mocks.rpgUpdateMany,
      deleteMany: mocks.rpgDeleteMany,
    },
  },
}))

import { DELETE, GET, PATCH } from "./route"

function makeRequest(
  method: "GET" | "PATCH" | "DELETE",
  body?: unknown,
) {
  return new NextRequest("http://localhost/api/rpg/rpg-1", {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(rpgId = "rpg-1") {
  return { params: Promise.resolve({ rpgId }) }
}

describe("GET /api/rpg/[rpgId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.getRpgPermission.mockResolvedValue({
      isOwner: true,
      isAcceptedMember: false,
      canManage: true,
    })
  })

  it("retorna 401 para usuario nao autenticado", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 404 quando RPG nao existe", async () => {
    mocks.queryRaw.mockResolvedValueOnce([])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 com dados do RPG", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "rpg-1",
        ownerId: "owner-1",
        title: "Campanha",
        description: "Descricao com mais de 10 caracteres.",
        image: null,
        visibility: "private",
        costsEnabled: false,
        costResourceName: "Skill Points",
        useMundiMap: false,
        useRaceBonuses: false,
        useClassBonuses: false,
        useClassRaceBonuses: false,
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.rpg.id).toBe("rpg-1")
    expect(json.rpg.canManage).toBe(true)
  })
})

describe("PATCH /api/rpg/[rpgId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.getRpgPermission.mockResolvedValue({
      exists: true,
      canManage: true,
      ownerId: "owner-1",
    })
    mocks.rpgUpdateMany.mockResolvedValue({ count: 1 })
    mocks.queryRaw.mockResolvedValue([{ progressionMode: "xp_level" }])
    mocks.executeRaw.mockResolvedValue(1)
  })

  it("retorna 400 quando tenta alterar configuracao de custos", async () => {
    const response = await PATCH(
      makeRequest("PATCH", {
        title: "Campanha",
        description: "Descricao com mais de 10 caracteres.",
        visibility: "private",
        costsEnabled: true,
      }),
      makeContext(),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Configuracao de custos disponivel apenas na criacao do RPG.",
    })
  })

  it("retorna 403 sem permissao de edicao", async () => {
    mocks.getRpgPermission.mockResolvedValue({
      exists: true,
      canManage: false,
      ownerId: "owner-1",
    })

    const response = await PATCH(
      makeRequest("PATCH", {
        title: "Campanha",
        description: "Descricao com mais de 10 caracteres.",
        visibility: "private",
      }),
      makeContext(),
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ message: "Voce nao pode editar este RPG." })
  })

  it("retorna 200 quando atualiza RPG", async () => {
    const response = await PATCH(
      makeRequest("PATCH", {
        title: "Campanha",
        description: "Descricao com mais de 10 caracteres.",
        visibility: "private",
      }),
      makeContext(),
    )

    expect(response.status).toBe(200)
    expect(mocks.rpgUpdateMany).toHaveBeenCalledTimes(1)
    expect(await response.json()).toEqual({ message: "RPG atualizado com sucesso." })
  })
})

describe("DELETE /api/rpg/[rpgId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.rpgDeleteMany.mockResolvedValue({ count: 1 })
    mocks.queryRaw.mockResolvedValue([{ image: null }])
  })

  it("retorna 404 quando RPG nao existe", async () => {
    mocks.rpgDeleteMany.mockResolvedValue({ count: 0 })

    const response = await DELETE(makeRequest("DELETE"), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 quando deleta RPG", async () => {
    const response = await DELETE(makeRequest("DELETE"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ message: "RPG deletado com sucesso." })
    expect(mocks.rpgDeleteMany).toHaveBeenCalledTimes(1)
  })
})
