import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({
  getUserIdFromCookieStore: vi.fn(),
  getMembership: vi.fn(),
  getRpg: vi.fn(),
  getCharacter: vi.fn(),
  getClassByKey: vi.fn(),
  listPurchasedSkillLevels: vi.fn(),
  listSkillClassLinks: vi.fn(),
  listSkillRaceLinks: vi.fn(),
  parseCharacterAbilities: vi.fn(),
  parseCostPoints: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  getUserIdFromCookieStore: mocks.getUserIdFromCookieStore,
}))

vi.mock("@/infrastructure/characters/repositories/prismaRpgAccessRepository", () => ({
  prismaRpgAccessRepository: {
    getMembership: mocks.getMembership,
  },
}))

vi.mock("@/infrastructure/characterAbilities/repositories/prismaCharacterAbilitiesRepository", () => ({
  prismaCharacterAbilitiesRepository: {
    getRpg: mocks.getRpg,
    getCharacter: mocks.getCharacter,
    getClassByKey: mocks.getClassByKey,
    listPurchasedSkillLevels: mocks.listPurchasedSkillLevels,
    listSkillClassLinks: mocks.listSkillClassLinks,
    listSkillRaceLinks: mocks.listSkillRaceLinks,
  },
}))

vi.mock("@/infrastructure/characterAbilities/services/legacyCharacterAbilitiesParserService", () => ({
  legacyCharacterAbilitiesParserService: {
    parseCharacterAbilities: mocks.parseCharacterAbilities,
    parseCostPoints: mocks.parseCostPoints,
  },
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

import AbilitiesPage from "./page"

describe("AbilitiesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromCookieStore.mockResolvedValue("user-1")
    mocks.getRpg.mockResolvedValue({
      id: "rpg-1",
      ownerId: "user-1",
      visibility: "public",
    })
    mocks.getCharacter.mockResolvedValue({
      id: "char-1",
      rpgId: "rpg-1",
      name: "Arthas",
      classKey: "warrior",
      visibility: "public",
      characterType: "player",
      createdByUserId: "user-1",
      abilities: [],
    })
    mocks.getClassByKey.mockResolvedValue({
      id: "class-1",
      key: "warrior",
      label: "Guerreiro",
    })
    mocks.parseCharacterAbilities.mockReturnValue([
      { skillId: "s1", level: 1 },
      { skillId: "s2", level: 2 },
    ])
    mocks.parseCostPoints.mockReturnValue(null)
    mocks.listPurchasedSkillLevels.mockResolvedValue([
      {
        skillId: "s1",
        skillName: "Golpe",
        skillDescription: "Ataque corpo a corpo.",
        skillCategory: "tecnicas",
        skillType: "attack",
        skillActionType: "action",
        skillTags: [],
        levelNumber: 1,
        levelRequired: 1,
        summary: "Resumo",
        stats: { name: "Golpe Preciso", damage: "1d8" },
        cost: {},
        target: {},
        area: {},
        scaling: {},
        requirement: {},
      },
      {
        skillId: "s2",
        skillName: "Raio Arcano",
        skillDescription: "Dano magico.",
        skillCategory: "arcana",
        skillType: "burst",
        skillActionType: "action",
        skillTags: [],
        levelNumber: 2,
        levelRequired: 2,
        summary: "Resumo",
        stats: { name: "Raio Maior", damage: "2d6" },
        cost: {},
        target: {},
        area: {},
        scaling: {},
        requirement: {},
      },
    ])
    mocks.listSkillClassLinks.mockResolvedValue([
      { skillId: "s1", classLabel: "Guerreiro" },
      { skillId: "s2", classLabel: "Mago" },
    ])
    mocks.listSkillRaceLinks.mockResolvedValue([
      { skillId: "s1", raceLabel: "Humano" },
      { skillId: "s2", raceLabel: "Elfo" },
    ])
  })

  it("renderiza habilidades sem titulo estatico", async () => {
    render(
      await AbilitiesPage({
        params: Promise.resolve({ rpgId: "rpg-1", characterId: "char-1" }),
      }),
    )

    expect(screen.getByRole("heading", { name: "Arthas" })).toBeInTheDocument()
    expect(screen.getByText("Golpe Preciso")).toBeInTheDocument()
    expect(screen.getByText("Raio Maior")).toBeInTheDocument()
  })
})
