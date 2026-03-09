import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/infrastructure/characterAbilities/gateways/httpCharacterAbilitiesGateway", () => ({
  httpCharacterAbilitiesGateway: {
    removeAbility: vi.fn().mockResolvedValue({ success: true }),
  },
}))

import AbilitiesFiltersClient from "@/presentation/character-abilities/AbilitiesFiltersClient"

const abilities = [
  {
    skillId: "s1",
    levelNumber: 1,
    skillName: "Golpe",
    levelName: "Golpe Preciso",
    skillDescription: "Ataque corpo a corpo.",
    levelDescription: null,
    notesList: [],
    skillCategory: "tecnicas",
    skillType: "attack",
    skillActionType: "action",
    skillTags: [],
    summary: "Resumo",
    damage: "1d8",
    range: "corpo a corpo",
    cooldown: null,
    duration: null,
    castTime: null,
    resourceCost: null,
    prerequisite: null,
    allowedClasses: ["Guerreiro"],
    allowedRaces: ["Humano"],
    levelRequired: 1,
    pointsCost: 1,
    costCustom: null,
    customFields: [],
  },
  {
    skillId: "s2",
    levelNumber: 2,
    skillName: "Raio Arcano",
    levelName: "Raio Maior",
    skillDescription: "Dano magico.",
    levelDescription: null,
    notesList: [],
    skillCategory: "arcana",
    skillType: "burst",
    skillActionType: "action",
    skillTags: [],
    summary: "Resumo",
    damage: "2d6",
    range: "distancia",
    cooldown: null,
    duration: null,
    castTime: null,
    resourceCost: null,
    prerequisite: null,
    allowedClasses: ["Mago"],
    allowedRaces: ["Elfo"],
    levelRequired: 2,
    pointsCost: 3,
    costCustom: null,
    customFields: [],
  },
]

describe("AbilitiesFiltersClient", () => {
  const deps = {
    gateway: {
      removeAbility: vi.fn().mockResolvedValue({ success: true }),
    },
  }

  it("renderiza as habilidades iniciais", () => {
    render(<AbilitiesFiltersClient characterId="char-1" abilities={abilities} deps={deps} />)

    expect(screen.getByText("Golpe Preciso")).toBeInTheDocument()
    expect(screen.getByText("Raio Maior")).toBeInTheDocument()
  })

  it("filtra por categoria selecionada", async () => {
    const user = userEvent.setup()
    render(<AbilitiesFiltersClient characterId="char-1" abilities={abilities} deps={deps} />)

    await user.click(screen.getByRole("button", { name: "Abrir filtros" }))
    const filtersDialog = screen.getByRole("dialog")
    await user.click(within(filtersDialog).getByRole("button", { name: "Técnicas" }))

    expect(screen.getByText("Golpe Preciso")).toBeInTheDocument()
    expect(screen.queryByText("Raio Maior")).not.toBeInTheDocument()
  })

  it("exibe estado vazio quando busca nao encontra resultados", async () => {
    const user = userEvent.setup()
    render(<AbilitiesFiltersClient characterId="char-1" abilities={abilities} deps={deps} />)

    await user.type(screen.getByPlaceholderText("Buscar..."), "inexistente")

    expect(
      screen.getByText("Nenhuma habilidade encontrada com os filtros atuais."),
    ).toBeInTheDocument()
  })
})
