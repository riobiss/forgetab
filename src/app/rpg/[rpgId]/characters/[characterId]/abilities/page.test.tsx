import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

const mocks = vi.hoisted(() => ({
  fetchCharacterAbilitiesViewModel: vi.fn(),
}))

vi.mock("@/infrastructure/characterAbilities/repositories/httpCharacterAbilitiesPageRepository", () => ({
  fetchCharacterAbilitiesViewModel: mocks.fetchCharacterAbilitiesViewModel,
  HttpCharacterAbilitiesError: class HttpCharacterAbilitiesError extends Error {
    constructor(message: string, readonly status: number) {
      super(message)
      this.name = "HttpCharacterAbilitiesError"
    }
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
    mocks.fetchCharacterAbilitiesViewModel.mockResolvedValue({
      rpgId: "rpg-1",
      characterId: "char-1",
      characterName: "Arthas",
      classLabel: "Guerreiro",
      abilities: [
        {
          skillId: "s1",
          levelName: "Golpe Preciso",
          skillName: "Golpe",
          skillDescription: "Ataque corpo a corpo.",
          levelDescription: null,
          notesList: [],
          customFields: [],
          skillCategory: "tecnicas",
          skillType: "attack",
          skillActionType: "action",
          skillTags: [],
          levelNumber: 1,
          levelRequired: 1,
          summary: "Resumo",
          damage: "1d8",
          range: null,
          cooldown: null,
          duration: null,
          castTime: null,
          resourceCost: null,
          prerequisite: null,
          allowedClasses: ["Guerreiro"],
          allowedRaces: ["Humano"],
          pointsCost: null,
          costCustom: null,
        },
        {
          skillId: "s2",
          levelName: "Raio Maior",
          skillName: "Raio Arcano",
          skillDescription: "Dano magico.",
          levelDescription: null,
          notesList: [],
          customFields: [],
          skillCategory: "arcana",
          skillType: "burst",
          skillActionType: "action",
          skillTags: [],
          levelNumber: 2,
          levelRequired: 2,
          summary: "Resumo",
          damage: "2d6",
          range: null,
          cooldown: null,
          duration: null,
          castTime: null,
          resourceCost: null,
          prerequisite: null,
          allowedClasses: ["Mago"],
          allowedRaces: ["Elfo"],
          pointsCost: null,
          costCustom: null,
        },
      ],
    })
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
