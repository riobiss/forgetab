import { describe, expect, it, vi } from "vitest"
import type { LibraryPageGateway } from "@/features/world/library/application/page/contracts/LibraryPageGateway"
import { loadLibraryPage, loadLibrarySectionPage } from "./loadLibraryPage"

function createGateway(): LibraryPageGateway {
  return {
    fetchRpgTitle: vi.fn().mockResolvedValue("Meu RPG"),
    fetchSectionTitle: vi.fn().mockResolvedValue("Historia"),
  }
}

describe("library page data", () => {
  it("carrega o titulo do RPG", async () => {
    await expect(loadLibraryPage(createGateway(), { rpgId: "rpg-1" })).resolves.toEqual({
      rpgTitle: "Meu RPG",
    })
  })

  it("retorna null quando a secao nao existe", async () => {
    const gateway = createGateway()
    vi.mocked(gateway.fetchSectionTitle).mockResolvedValue(null)

    await expect(
      loadLibrarySectionPage(gateway, { rpgId: "rpg-1", sectionId: "missing" }),
    ).resolves.toBeNull()
  })
})
