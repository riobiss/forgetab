import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({
  getUserIdFromCookieStore: vi.fn(),
  getMembership: vi.fn(),
  getRpg: vi.fn(),
  listCharacters: vi.fn(),
  countOwnPlayerCharacters: vi.fn(),
  loadCharacterEditorBootstrapServer: vi.fn(),
  push: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  getUserIdFromCookieStore: mocks.getUserIdFromCookieStore,
}))

vi.mock("@/infrastructure/characters/repositories/prismaRpgAccessRepository", () => ({
  prismaRpgAccessRepository: {
    getMembership: mocks.getMembership,
  },
}))

vi.mock("@/infrastructure/charactersDashboard/repositories/prismaCharactersDashboardRepository", () => ({
  prismaCharactersDashboardRepository: {
    getRpg: mocks.getRpg,
    listCharacters: mocks.listCharacters,
    countOwnPlayerCharacters: mocks.countOwnPlayerCharacters,
  },
}))

vi.mock("@/application/charactersEditor/use-cases/loadCharacterEditorBootstrapServer", () => ({
  loadCharacterEditorBootstrapServerUseCase: mocks.loadCharacterEditorBootstrapServer,
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt?: string; src?: string }) => (
    <span aria-label={alt ?? ""} data-src={src ?? ""} role="img" />
  ),
}))

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
  usePathname: () => "/rpg/rpg-1/characters",
  useRouter: () => ({
    push: mocks.push,
    refresh: vi.fn(),
  }),
  useSearchParams: () => {
    const params = new URLSearchParams()
    return {
      get: (key: string) => params.get(key),
      toString: () => params.toString(),
    }
  },
}))

import CharactersPage from "./page"

describe("CharactersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromCookieStore.mockResolvedValue("user-1")
    mocks.getMembership.mockResolvedValue({ status: "accepted", role: "player" })
    mocks.loadCharacterEditorBootstrapServer.mockResolvedValue(null)
    mocks.getRpg.mockResolvedValue({
      id: "rpg-1",
      ownerId: "owner-1",
      visibility: "public",
      allowMultiplePlayerCharacters: false,
    })
    mocks.listCharacters.mockResolvedValue([
      {
        id: "c1",
        name: "Player 1",
        image: null,
        characterType: "player",
        createdByUserId: "user-1",
      },
    ])
    mocks.countOwnPlayerCharacters.mockResolvedValue(1)
  })

  it("nao mostra criacao extra para membro com player existente quando multiplos estao desabilitados", async () => {
    render(
      await CharactersPage({
        params: Promise.resolve({ rpgId: "rpg-1" }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(
      screen.queryByRole("link", { name: "Criar outro personagem" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Criar personagem" })).not.toBeInTheDocument()
  })

  it("mostra criacao extra para membro com player existente quando multiplos estao habilitados", async () => {
    mocks.getRpg.mockResolvedValue({
      id: "rpg-1",
      ownerId: "owner-1",
      visibility: "public",
      allowMultiplePlayerCharacters: true,
    })

    render(
      await CharactersPage({
        params: Promise.resolve({ rpgId: "rpg-1" }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(
      screen.getByRole("link", { name: "Criar outro personagem" }),
    ).toBeInTheDocument()
  })
})
