import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  queryRaw: vi.fn(),
  getUserIdFromCookieStore: vi.fn(),
  getMembershipStatus: vi.fn(),
  parseCharacterAbilities: vi.fn(),
  parseCostPoints: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rpg: {
      findUnique: mocks.findUnique,
    },
    $queryRaw: mocks.queryRaw,
  },
}))

vi.mock("@/lib/server/auth", () => ({
  getUserIdFromCookieStore: mocks.getUserIdFromCookieStore,
}))

vi.mock("@/lib/server/rpgAccess", () => ({
  getMembershipStatus: mocks.getMembershipStatus,
}))

vi.mock("@/lib/server/costSystem", () => ({
  parseCharacterAbilities: mocks.parseCharacterAbilities,
  parseCostPoints: mocks.parseCostPoints,
}))

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
}))

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("@/components/select/NativeSelectField", () => ({
  NativeSelectField: ({
    value,
    onChange,
    children,
  }: {
    value?: string
    onChange?: (event: { target: { value: string } }) => void
    children: ReactNode
  }) => (
    <select
      value={value}
      onChange={(event) => onChange?.({ target: { value: event.target.value } })}
    >
      {children}
    </select>
  ),
}))

import AbilitiesPage from "./page"

describe("AbilitiesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromCookieStore.mockResolvedValue("user-1")
    mocks.findUnique.mockResolvedValue({
      id: "rpg-1",
      ownerId: "user-1",
      visibility: "public",
    })
    mocks.parseCharacterAbilities.mockReturnValue([
      { skillId: "s1", level: 1 },
      { skillId: "s2", level: 2 },
    ])
    mocks.parseCostPoints.mockReturnValue(null)

    mocks.queryRaw
      .mockResolvedValueOnce([
        {
          id: "char-1",
          rpgId: "rpg-1",
          name: "Arthas",
          classKey: "warrior",
          visibility: "public",
          characterType: "player",
          createdByUserId: "user-1",
          abilities: [],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "class-1",
          key: "warrior",
          label: "Guerreiro",
        },
      ])
      .mockResolvedValueOnce([
        {
          skillId: "s1",
          skillName: "Golpe",
          skillDescription: "Ataque corpo a corpo.",
          skillCategory: "fisicas",
          skillType: "attack",
          skillActionType: "action",
          levelNumber: 1,
          levelRequired: 1,
          summary: "Resumo",
          stats: { name: "Golpe Preciso", damage: "1d8" },
          cost: {},
          target: {},
          area: {},
          scaling: {},
          requirement: {},
          effects: [],
        },
        {
          skillId: "s2",
          skillName: "Raio Arcano",
          skillDescription: "Dano magico.",
          skillCategory: "magicas",
          skillType: "burst",
          skillActionType: "action",
          levelNumber: 2,
          levelRequired: 2,
          summary: "Resumo",
          stats: { name: "Raio Maior", damage: "2d6" },
          cost: {},
          target: {},
          area: {},
          scaling: {},
          requirement: {},
          effects: [],
        },
      ])
  })

  it("renderiza habilidades com categorias formatadas", async () => {
    render(
      await AbilitiesPage({
        params: Promise.resolve({ rpgId: "rpg-1", characterId: "char-1" }),
      }),
    )

    expect(screen.getByRole("heading", { name: "Habilidades do Personagem" })).toBeInTheDocument()
    expect(screen.getAllByText("Fisicas").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Magicas (Arcanas)").length).toBeGreaterThan(0)
  })
})
