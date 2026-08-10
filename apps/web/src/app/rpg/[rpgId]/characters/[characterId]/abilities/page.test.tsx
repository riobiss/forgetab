import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  redirect: vi.fn()
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}))

import AbilitiesPage from "./page"

describe("AbilitiesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redireciona a rota legada para a pagina canonica de habilidades", async () => {
    await AbilitiesPage({
      params: Promise.resolve({ rpgId: "rpg-1", characterId: "char-1" })
    })

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/rpg/rpg-1/characters/char-1/skills"
    )
  })
})
