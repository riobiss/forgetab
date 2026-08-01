import { describe, expect, it, vi } from "vitest"
import type { LibraryAccessService } from "@/features/world/library/application/ports/LibraryAccessService"
import type { LibrarySectionRepository } from "@/features/world/library/application/ports/LibraryRepository"
import {
  getLibrarySection,
  listLibrarySections,
} from "./librarySections"

const ownPrivateSection = {
  id: "section-own",
  rpgId: "rpg-1",
  createdByUserId: "user-1",
  title: "Anotacoes",
  description: null,
  visibility: "private" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

function createDependencies(sections = [ownPrivateSection]) {
  const repository = {
    listSections: vi.fn().mockResolvedValue(sections),
    findSection: vi.fn().mockResolvedValue(ownPrivateSection),
  } as unknown as LibrarySectionRepository
  const accessService = {
    getRpgAccess: vi.fn().mockResolvedValue({
      exists: true,
      canView: true,
      canManage: false,
    }),
  } satisfies LibraryAccessService

  return { repository, accessService }
}

describe("library section access", () => {
  it("lista a secao privada criada pelo proprio membro", async () => {
    const result = await listLibrarySections(createDependencies(), {
      rpgId: "rpg-1",
      userId: "user-1",
    })

    expect(result.sections).toEqual([
      expect.objectContaining({
        id: "section-own",
        canEdit: true,
        canDelete: true,
      }),
    ])
  })

  it("oculta secoes privadas criadas por outro membro", async () => {
    const otherPrivateSection = {
      ...ownPrivateSection,
      id: "section-other",
      createdByUserId: "user-2",
    }
    const result = await listLibrarySections(
      createDependencies([ownPrivateSection, otherPrivateSection]),
      { rpgId: "rpg-1", userId: "user-1" },
    )

    expect(result.sections.map((section) => section.id)).toEqual(["section-own"])
  })

  it("permite abrir a secao privada criada pelo proprio membro", async () => {
    const result = await getLibrarySection(createDependencies(), {
      rpgId: "rpg-1",
      sectionId: "section-own",
      userId: "user-1",
    })

    expect(result.section).toEqual(
      expect.objectContaining({ id: "section-own", canEdit: true }),
    )
  })
})
