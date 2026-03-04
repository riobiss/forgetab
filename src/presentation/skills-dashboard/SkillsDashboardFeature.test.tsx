import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpSkillsDashboardGateway } from "@/infrastructure/skillsDashboard/gateways/httpSkillsDashboardGateway"

const mocks = vi.hoisted(() => ({
  clientSpy: vi.fn(),
}))

vi.mock("@/presentation/skills-dashboard/SkillsDashboardClient", () => ({
  default: (props: unknown) => {
    mocks.clientSpy(props)
    return <div data-testid="skills-dashboard-client" />
  },
}))

import SkillsDashboardFeature from "@/presentation/skills-dashboard/SkillsDashboardFeature"

describe("SkillsDashboardFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("injeta deps no client com factory padrao", () => {
    render(
      <SkillsDashboardFeature ownedRpgs={[{ id: "rpg-1", title: "RPG 1" }]} initialRpgId="rpg-1" />,
    )

    expect(screen.getByTestId("skills-dashboard-client")).toBeInTheDocument()
    expect(mocks.clientSpy).toHaveBeenCalledTimes(1)

    const call = mocks.clientSpy.mock.calls[0]?.[0] as {
      deps: { gateway: unknown }
      ownedRpgs: Array<{ id: string; title: string }>
      initialRpgId?: string
    }

    expect(call.ownedRpgs).toEqual([{ id: "rpg-1", title: "RPG 1" }])
    expect(call.initialRpgId).toBe("rpg-1")
    expect(call.deps.gateway).toBe(httpSkillsDashboardGateway)
  })

  it("aceita factory explicita", () => {
    render(
      <SkillsDashboardFeature
        ownedRpgs={[{ id: "rpg-1", title: "RPG 1" }]}
        initialRpgId="rpg-1"
        gatewayFactory="http"
      />,
    )

    expect(mocks.clientSpy).toHaveBeenCalledTimes(1)

    const call = mocks.clientSpy.mock.calls[0]?.[0] as {
      deps: { gateway: unknown }
    }
    expect(call.deps.gateway).toBe(httpSkillsDashboardGateway)
  })
})
