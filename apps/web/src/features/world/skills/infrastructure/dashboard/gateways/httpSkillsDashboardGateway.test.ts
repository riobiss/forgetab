import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn()
}))

vi.mock("@/features/http/infrastructure/apiFetch", () => ({
  apiFetch: mocks.apiFetch
}))

import { httpSkillsDashboardGateway } from "./httpSkillsDashboardGateway"

describe("httpSkillsDashboardGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("codifica os identificadores usados na URL", async () => {
    mocks.apiFetch.mockResolvedValue(
      new Response(JSON.stringify({ skill: { id: "skill/1" } }), {
        status: 200
      })
    )

    await httpSkillsDashboardGateway.fetchSkillById("skill/1")

    expect(mocks.apiFetch).toHaveBeenCalledWith("/api/skills/skill%2F1")
  })

  it("preserva a mensagem de erro retornada pela API", async () => {
    mocks.apiFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: "Skill nao encontrada." }), {
        status: 404
      })
    )

    await expect(
      httpSkillsDashboardGateway.fetchSkillById("skill-1")
    ).rejects.toThrow("Skill nao encontrada.")
  })

  it("rejeita resposta de sucesso que nao seja JSON", async () => {
    mocks.apiFetch.mockResolvedValue(
      new Response("<html>proxy error</html>", { status: 200 })
    )

    await expect(
      httpSkillsDashboardGateway.fetchSkills("rpg-1")
    ).rejects.toThrow("Resposta invalida da API.")
  })
})
