import { describe, expect, it } from "vitest"
import { httpSkillsDashboardGateway } from "@/features/world/skills/infrastructure/dashboard/gateways/httpSkillsDashboardGateway"
import { createSkillsDashboardDependencies } from "@/features/world/skills/presentation/dashboard/dependencies"

describe("createSkillsDashboardDependencies", () => {
  it("retorna gateway http por padrao", () => {
    const deps = createSkillsDashboardDependencies()
    expect(deps.gateway).toBe(httpSkillsDashboardGateway)
  })

  it("retorna gateway http quando factory e explicitamente http", () => {
    const deps = createSkillsDashboardDependencies("http")
    expect(deps.gateway).toBe(httpSkillsDashboardGateway)
  })
})
