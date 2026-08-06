import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { EntityCatalogAbilityView } from "@/features/world/catalog/application/types"

const mocks = vi.hoisted(() => ({
  buySkill: vi.fn()
}))

vi.mock(
  "@/features/world/catalog/presentation/useEntityAbilityPurchase",
  () => ({
    useEntityAbilityPurchase: () => ({
      points: 5,
      loadingKey: "",
      buySkill: mocks.buySkill
    })
  })
)

import EntityAbilitiesPanel from "@/features/world/catalog/presentation/EntityAbilitiesPanel"

const skill: EntityCatalogAbilityView = {
  skillId: "skill-1",
  skillName: "Ataque Arcano",
  skillDescription: "Dispara energia.",
  skillCategory: "arcana",
  skillType: "attack",
  skillActionType: "action",
  skillTags: [],
  levels: [
    {
      levelNumber: 1,
      levelRequired: 1,
      levelCategory: null,
      levelType: null,
      levelActionType: null,
      levelName: "Faísca",
      levelDescription: null,
      notesList: [],
      customFields: [],
      description: null,
      summary: null,
      damage: "1d6",
      range: null,
      cooldown: null,
      duration: null,
      castTime: null,
      resourceCost: null,
      pointsCost: 2,
      costCustom: null
    }
  ]
}

describe("EntityAbilitiesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buySkill.mockResolvedValue({ remainingPoints: 3 })
  })

  it("não renderiza painel vazio", () => {
    const { container } = render(<EntityAbilitiesPanel skills={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("explica e bloqueia compra sem personagem elegível", () => {
    render(
      <EntityAbilitiesPanel
        skills={[skill]}
        purchase={{
          characterId: null,
          costsEnabled: true,
          costResourceName: "Pontos",
          initialPoints: 5,
          initialOwnedBySkill: {}
        }}
      />
    )

    expect(
      screen.getByText(
        "Nenhum personagem elegivel para comprar esta habilidade."
      )
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Comprar" })).toBeDisabled()
  })

  it("marca o nível como comprado sem mutar o estado anterior", async () => {
    const user = userEvent.setup()
    render(
      <EntityAbilitiesPanel
        skills={[skill]}
        purchase={{
          characterId: "character-1",
          costsEnabled: true,
          costResourceName: "Pontos",
          initialPoints: 5,
          initialOwnedBySkill: {}
        }}
      />
    )

    await user.click(screen.getByRole("button", { name: "Comprar" }))

    expect(mocks.buySkill).toHaveBeenCalledWith("skill-1", 1, "skill-1:1")
    expect(screen.getByRole("button", { name: "Comprado" })).toBeDisabled()
  })
})
