import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  buySkill: vi.fn(),
}))

vi.mock("@/presentation/api/characters/requestAuth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/infrastructure/characterAbilities/services/legacyCharacterSkillPurchaseService", () => ({
  legacyCharacterSkillPurchaseService: {
    buySkill: mocks.buySkill,
    removeSkill: vi.fn(),
  },
}))

import { POST } from "./route"

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/characters/char-1/buy-skill", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeContext(id = "char-1") {
  return { params: Promise.resolve({ id }) }
}

describe("POST /api/characters/[id]/buy-skill", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
  })

  it("retorna 401 para usuario nao autenticado", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await POST(makeRequest({ skillId: "s1", level: 1 }), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 400 para payload invalido", async () => {
    const response = await POST(makeRequest({ skillId: "", level: 0 }), makeContext())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: "skillId e obrigatorio." })
  })

  it("retorna erro do service", async () => {
    mocks.buySkill.mockRejectedValue(new Error("boom"))

    const response = await POST(makeRequest({ skillId: "skill-1", level: 1 }), makeContext())

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: "Erro interno ao comprar habilidade." })
  })

  it("retorna 200 quando compra habilidade com sucesso", async () => {
    mocks.buySkill.mockResolvedValue({
      status: 200,
      success: true,
      remainingPoints: 3,
    })

    const response = await POST(makeRequest({ skillId: "skill-1", level: 1 }), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      status: 200,
      success: true,
      remainingPoints: 3,
    })
    expect(mocks.buySkill).toHaveBeenCalledWith("char-1", "user-1", {
      skillId: "skill-1",
      level: 1,
    })
  })
})
