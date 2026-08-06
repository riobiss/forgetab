import { describe, expect, it, vi } from "vitest"

import {
  deleteRpgUseCase,
  loadRpgCatalogUseCase,
  type RpgCatalogRepository
} from "./catalog"

describe("world catalog contracts", () => {
  it("carrega RPGs criados e publicos pelo port compartilhado", async () => {
    const repository: RpgCatalogRepository = {
      listOwnedByUser: vi.fn().mockResolvedValue([{ id: "owned" }]),
      listPublicExcludingUser: vi.fn().mockResolvedValue([{ id: "public" }])
    } as RpgCatalogRepository

    await expect(
      loadRpgCatalogUseCase(repository, { userId: "user-1" })
    ).resolves.toMatchObject({
      userId: "user-1",
      createdRpgs: [{ id: "owned" }],
      publicRpgs: [{ id: "public" }]
    })
  })

  it("nao consulta RPGs proprios para visitante anonimo", async () => {
    const repository: RpgCatalogRepository = {
      listOwnedByUser: vi.fn(),
      listPublicExcludingUser: vi.fn().mockResolvedValue([])
    }

    const result = await loadRpgCatalogUseCase(repository, { userId: null })

    expect(repository.listOwnedByUser).not.toHaveBeenCalled()
    expect(result.createdRpgs).toEqual([])
  })

  it("delega a exclusao ao gateway", async () => {
    const deleteRpg = vi.fn().mockResolvedValue(undefined)

    await deleteRpgUseCase({ gateway: { deleteRpg } }, { rpgId: "rpg-1" })

    expect(deleteRpg).toHaveBeenCalledWith("rpg-1")
  })
})
