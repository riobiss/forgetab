import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { httpPublicMarkerSectionSyncGateway } from "./httpPublicMarkerSectionSyncGateway"

vi.mock("@/features/http/infrastructure/apiFetch", () => ({
  apiFetch: vi.fn()
}))

const apiFetchMock = vi.mocked(apiFetch)

describe("httpPublicMarkerSectionSyncGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("atualiza somente o marcador publico indicado", async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ markerId: "marker/1" }), { status: 200 })
    )
    const update = {
      name: "Cidade",
      location: "Norte",
      shortDescription: null,
      image: null,
      color: "#fff"
    }

    await httpPublicMarkerSectionSyncGateway.update({
      rpgId: "rpg-1",
      mapId: "map-1",
      groupId: "group/1",
      markerId: "marker/1",
      update
    })

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/rpg/rpg-1/maps/map-1/marker-groups/group%2F1/markers/marker%2F1",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update)
      }
    )
  })
})
