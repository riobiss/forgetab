import { describe, expect, it, vi } from "vitest"
import type { MarkerSectionLinkRepository } from "@/features/world/location/application/ports/MarkerSectionLinkRepository"
import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import { setMarkerSectionLink } from "./setMarkerSectionLink"

function createAccessService(
  access: Awaited<ReturnType<RpgMapAccessService["getAccess"]>> = {
    exists: true,
    userId: "user-1",
    canManage: false,
    isAcceptedMember: true
  }
): RpgMapAccessService {
  return { getAccess: vi.fn().mockResolvedValue(access) }
}

function createRepository(
  status: Awaited<ReturnType<MarkerSectionLinkRepository["setLink"]>> = {
    status: "linked",
    sectionId: "section-1"
  }
): MarkerSectionLinkRepository {
  return { setLink: vi.fn().mockResolvedValue(status) }
}

const body = {
  sectionId: " section-1 ",
  marker: {
    id: " marker-1 ",
    groupId: " group-1 ",
    visibility: "private",
    name: " Cidade ",
    location: " Norte ",
    shortDescription: null,
    image: null,
    color: " #fff "
  }
}

describe("setMarkerSectionLink", () => {
  it("normaliza e delega o vinculo para o repositorio", async () => {
    const repository = createRepository()

    await expect(
      setMarkerSectionLink(repository, createAccessService(), {
        rpgId: "rpg-1",
        mapId: "map-1",
        userId: "user-1",
        body
      })
    ).resolves.toEqual({
      markerId: "marker-1",
      sectionId: "section-1"
    })

    expect(repository.setLink).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      mapId: "map-1",
      sectionId: "section-1",
      marker: {
        id: "marker-1",
        groupId: "group-1",
        visibility: "private",
        name: "Cidade",
        location: "Norte",
        shortDescription: null,
        image: null,
        color: "#fff"
      }
    })
  })

  it("nega acesso a quem nao participa do RPG", async () => {
    const repository = createRepository()
    const accessService = createAccessService({
      exists: true,
      userId: "user-2",
      canManage: false,
      isAcceptedMember: false
    })

    await expect(
      setMarkerSectionLink(repository, accessService, {
        rpgId: "rpg-1",
        mapId: "map-1",
        userId: "user-2",
        body
      })
    ).rejects.toThrow("RPG nao encontrado.")
    expect(repository.setLink).not.toHaveBeenCalled()
  })

  it("converte resultados ausentes em erro de aplicacao", async () => {
    await expect(
      setMarkerSectionLink(
        createRepository({ status: "marker_not_found" }),
        createAccessService(),
        {
          rpgId: "rpg-1",
          mapId: "map-1",
          userId: "user-1",
          body: {
            ...body,
            marker: { ...body.marker, visibility: "public" }
          }
        }
      )
    ).rejects.toThrow("Marcador nao encontrado.")
  })
})
