import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { httpItemsDashboardGateway } from "@/infrastructure/itemsDashboard/gateways/httpItemsDashboardGateway"

const mocks = vi.hoisted(() => ({
  clientSpy: vi.fn(),
}))

vi.mock("@/presentation/items-dashboard/ItemsDashboardClient", () => ({
  default: (props: unknown) => {
    mocks.clientSpy(props)
    return <div data-testid="items-dashboard-client" />
  },
}))

import ItemsDashboardFeature from "@/presentation/items-dashboard/ItemsDashboardFeature"

describe("ItemsDashboardFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("injeta deps no client com factory padrao", () => {
    render(<ItemsDashboardFeature rpgId="rpg-1" />)

    expect(screen.getByTestId("items-dashboard-client")).toBeInTheDocument()
    expect(mocks.clientSpy).toHaveBeenCalledTimes(1)

    const call = mocks.clientSpy.mock.calls[0]?.[0] as {
      deps: { gateway: unknown }
      rpgId: string
    }

    expect(call.rpgId).toBe("rpg-1")
    expect(call.deps.gateway).toBe(httpItemsDashboardGateway)
  })

  it("aceita factory explicita", () => {
    render(<ItemsDashboardFeature rpgId="rpg-1" gatewayFactory="http" />)

    expect(mocks.clientSpy).toHaveBeenCalledTimes(1)

    const call = mocks.clientSpy.mock.calls[0]?.[0] as {
      deps: { gateway: unknown }
    }

    expect(call.deps.gateway).toBe(httpItemsDashboardGateway)
  })
})
