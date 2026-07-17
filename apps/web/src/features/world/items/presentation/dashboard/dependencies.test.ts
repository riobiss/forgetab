import { describe, expect, it } from "vitest"
import { httpItemsDashboardGateway } from "@/features/world/items/infrastructure/dashboard/gateways/httpItemsDashboardGateway"
import { createItemsDashboardDependencies } from "@/features/world/items/presentation/dashboard/dependencies"

describe("createItemsDashboardDependencies", () => {
  it("retorna gateway http por padrao", () => {
    const deps = createItemsDashboardDependencies()
    expect(deps.gateway).toBe(httpItemsDashboardGateway)
  })

  it("retorna gateway http quando factory e explicitamente http", () => {
    const deps = createItemsDashboardDependencies("http")
    expect(deps.gateway).toBe(httpItemsDashboardGateway)
  })
})
