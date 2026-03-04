import { describe, expect, it } from "vitest"
import { httpSkillsDashboardGateway } from "@/infrastructure/skillsDashboard/gateways/httpSkillsDashboardGateway"
import { createSkillsDashboardDependencies } from "@/presentation/skills-dashboard/dependencies"

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
