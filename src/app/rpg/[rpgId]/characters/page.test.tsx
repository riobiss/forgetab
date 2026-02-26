import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  getUserIdFromCookieStore: vi.fn(),
  getMembershipStatus: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}))

vi.mock("@/lib/server/auth", () => ({
  getUserIdFromCookieStore: mocks.getUserIdFromCookieStore,
}))

vi.mock("@/lib/server/rpgAccess", () => ({
  getMembershipStatus: mocks.getMembershipStatus,
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt?: string; src?: string }) => (
    <img alt={alt ?? ""} src={src ?? ""} />
  ),
}))

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
}))

import CharactersPage from "./page"

describe("CharactersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromCookieStore.mockResolvedValue("user-1")
    mocks.getMembershipStatus.mockResolvedValue("accepted")
  })

  it("nao mostra criacao extra para membro com player existente quando multiplos estao desabilitados", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([
        {
          id: "rpg-1",
          ownerId: "owner-1",
          visibility: "public",
          allowMultiplePlayerCharacters: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "c1",
          name: "Player 1",
          image: null,
          characterType: "player",
          createdByUserId: "user-1",
        },
      ])

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
    mocks.queryRaw
      .mockResolvedValueOnce([
        {
          id: "rpg-1",
          ownerId: "owner-1",
          visibility: "public",
          allowMultiplePlayerCharacters: true,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "c1",
          name: "Player 1",
          image: null,
          characterType: "player",
          createdByUserId: "user-1",
        },
      ])

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
