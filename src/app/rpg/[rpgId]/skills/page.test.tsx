import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  loadSkillsPageUseCase: vi.fn(),
  prismaSkillsPageRepository: {},
  skillsPageAccessService: {},
  dashboardSpy: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
}))

vi.mock("@/infrastructure/session/services/cookieCurrentUserSessionService", () => ({
  cookieCurrentUserSessionService: {
    getCurrentUserId: mocks.getCurrentUserId,
  },
}))

vi.mock("@/application/skillsPage/use-cases/loadSkillsPage", () => ({
  loadSkillsPageUseCase: mocks.loadSkillsPageUseCase,
}))

vi.mock("@/infrastructure/skillsPage/repositories/prismaSkillsPageRepository", () => ({
  prismaSkillsPageRepository: mocks.prismaSkillsPageRepository,
}))

vi.mock("@/infrastructure/skillsPage/services/skillsPageAccessService", () => ({
  skillsPageAccessService: mocks.skillsPageAccessService,
}))

vi.mock("@/presentation/skills-dashboard/SkillsDashboardFeature", () => ({
  default: (props: unknown) => {
    mocks.dashboardSpy(props)
    return <div data-testid="skills-dashboard" />
  },
}))

import SkillsPage from "./page"

describe("RpgSkillsBuilderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUserId.mockResolvedValue("user-1")
    mocks.loadSkillsPageUseCase.mockResolvedValue({
      rpg: { id: "rpg-1", title: "Campanha" },
    })
  })

  it("renderiza o dashboard com o rpg carregado no servidor", async () => {
    render(await SkillsPage({ params: Promise.resolve({ rpgId: "rpg-1" }) }))

    expect(screen.getByTestId("skills-dashboard")).toBeInTheDocument()
    expect(mocks.loadSkillsPageUseCase).toHaveBeenCalledWith(
      mocks.prismaSkillsPageRepository,
      mocks.skillsPageAccessService,
      { rpgId: "rpg-1", userId: "user-1" },
    )
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

  it("retorna notFound quando nao ha sessao", async () => {
    mocks.getCurrentUserId.mockResolvedValueOnce(null)

    await expect(
      SkillsPage({ params: Promise.resolve({ rpgId: "rpg-1" }) }),
    ).rejects.toThrow("NOT_FOUND")
    expect(mocks.loadSkillsPageUseCase).not.toHaveBeenCalled()
  })

  it("retorna notFound quando o rpg nao existe ou usuario nao gerencia", async () => {
    mocks.loadSkillsPageUseCase.mockResolvedValueOnce(null)

    await expect(
      SkillsPage({ params: Promise.resolve({ rpgId: "rpg-1" }) }),
    ).rejects.toThrow("NOT_FOUND")
  })
})
