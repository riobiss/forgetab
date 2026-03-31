import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  updateRpgMap: vi.fn(),
}))

vi.mock("@/presentation/api/characters/requestAuth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/application/rpgMap/use-cases/rpgMap", () => ({
  updateRpgMap: mocks.updateRpgMap,
  deleteRpgMap: vi.fn(),
  getRpgMapDetail: vi.fn(),
}))

import { PATCH } from "./route"

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/maps/map-1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeContext() {
  return { params: Promise.resolve({ rpgId: "rpg-1", mapId: "map-1" }) }
}

describe("maps by id route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("u1")
  })

  it("retorna 401 sem autenticacao", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await PATCH(
      makeRequest({ title: "Mapa", description: null, type: null, image: "https://img.com/map.png" }),
      makeContext(),
    )

    expect(response.status).toBe(401)
    expect(mocks.updateRpgMap).not.toHaveBeenCalled()
  })

  it("retorna 403 quando o use case negar a alteracao", async () => {
    mocks.updateRpgMap.mockRejectedValue(
      new AppError("Voce so pode editar ou remover registros criados por voce.", 403),
    )

    const response = await PATCH(
      makeRequest({ title: "Mapa", description: null, type: null, image: "https://img.com/map.png" }),
      makeContext(),
    )

    expect(response.status).toBe(403)
  })

  it("retorna 200 ao atualizar mapa", async () => {
    mocks.updateRpgMap.mockResolvedValue({
      map: {
        id: "map-1",
        rpgId: "rpg-1",
        createdByUserId: "u1",
        title: "Mapa",
        description: null,
        type: null,
        image: "https://img.com/map.png",
        order: 0,
        sectionsCount: 0,
        createdAt: "2026-03-19T00:00:00.000Z",
        updatedAt: "2026-03-19T00:00:00.000Z",
      },
    })

    const body = { title: "Mapa", description: null, type: null, image: "https://img.com/map.png" }
    const response = await PATCH(makeRequest(body), makeContext())

    expect(response.status).toBe(200)
    expect(mocks.updateRpgMap).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      rpgId: "rpg-1",
      mapId: "map-1",
      userId: "u1",
      body,
    })

    const json = await response.json()
    expect(json.map?.image).toBe("https://img.com/map.png")
  })
})
