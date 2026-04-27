import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchRpgPageAccess: vi.fn(),
  dashboardSpy: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
}))

vi.mock("@/infrastructure/rpgManagement/repositories/httpRpgPageAccessRepository", () => {
  class HttpPageAccessError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message)
      this.name = "HttpPageAccessError"
    }
  }

  return {
    fetchRpgPageAccess: mocks.fetchRpgPageAccess,
    HttpPageAccessError,
  }
})

vi.mock("@/presentation/skills-dashboard/SkillsDashboardFeature", () => ({
  default: (props: unknown) => {
    mocks.dashboardSpy(props)
    return <div data-testid="skills-dashboard" />
  },
}))

import SkillsPage from "./page"
import { HttpPageAccessError } from "@/infrastructure/rpgManagement/repositories/httpRpgPageAccessRepository"

describe("RpgSkillsBuilderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchRpgPageAccess.mockResolvedValue({
      id: "rpg-1",
      title: "Campanha",
      canManage: true,
    })
  })

  it("renderiza o dashboard com o rpg carregado no servidor", async () => {
    render(await SkillsPage({ params: Promise.resolve({ rpgId: "rpg-1" }) }))

    expect(screen.getByTestId("skills-dashboard")).toBeInTheDocument()
    expect(mocks.fetchRpgPageAccess).toHaveBeenCalledWith("rpg-1")
    expect(mocks.dashboardSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ownedRpgs: [{ id: "rpg-1", title: "Campanha" }],
        initialRpgId: "rpg-1",
        gatewayFactory: "http",
        hideRpgSelector: true,
        title: "Habilidades - Campanha",
      }),
    )
  })

  it("retorna notFound quando usuario nao pode gerenciar", async () => {
    mocks.fetchRpgPageAccess.mockResolvedValueOnce({
      id: "rpg-1",
      title: "Campanha",
      canManage: false,
    })

    await expect(
      SkillsPage({ params: Promise.resolve({ rpgId: "rpg-1" }) }),
    ).rejects.toThrow("NOT_FOUND")
  })

  it("retorna notFound quando a API nega acesso", async () => {
    mocks.fetchRpgPageAccess.mockRejectedValueOnce(new HttpPageAccessError("Nao autorizado.", 401))

    await expect(
      SkillsPage({ params: Promise.resolve({ rpgId: "rpg-1" }) }),
    ).rejects.toThrow("NOT_FOUND")
  })
})
