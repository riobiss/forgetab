import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { httpMarkerSectionLinkGateway } from "./httpMarkerSectionLinkGateway"

vi.mock("@/features/http/infrastructure/apiFetch", () => ({
  apiFetch: vi.fn(),
}))

const apiFetchMock = vi.mocked(apiFetch)
const marker = {
  id: "marker/1",
  groupId: "group-1",
  visibility: "private" as const,
  name: "Cidade",
  location: "Norte",
  shortDescription: null,
  image: null,
  color: "#fff",
}

describe("httpMarkerSectionLinkGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("salva o vinculo em uma unica requisicao", async () => {
    apiFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ markerId: "marker/1", sectionId: "section-1" }),
        { status: 200 },
      ),
    )

    await expect(
      httpMarkerSectionLinkGateway.setLink({
        rpgId: "rpg-1",
        mapId: "map-1",
        sectionId: "section-1",
        marker,
      }),
    ).resolves.toEqual({
      markerId: "marker/1",
      sectionId: "section-1",
    })

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/rpg/rpg-1/maps/map-1/marker-links/marker%2F1",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: "section-1", marker }),
      },
    )
  })

  it("propaga a mensagem de erro da API", async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Secao nao encontrada." }), {
        status: 404,
      }),
    )

    await expect(
      httpMarkerSectionLinkGateway.setLink({
        rpgId: "rpg-1",
        mapId: "map-1",
        sectionId: "section-1",
        marker,
      }),
    ).rejects.toThrow("Secao nao encontrada.")
  })
})
