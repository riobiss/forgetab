import { describe, expect, it, vi } from "vitest"
import { ensureItemsLayoutAccessUseCase } from "@/application/itemsLayout/use-cases/ensureItemsLayoutAccess"

describe("ensureItemsLayoutAccessUseCase", () => {
  it("nega acesso sem usuario autenticado", async () => {
    const result = await ensureItemsLayoutAccessUseCase(
      {
        sessionService: { getCurrentUserId: vi.fn().mockResolvedValue(null) },
        permissionService: { canManageRpg: vi.fn() },
      },
      { rpgId: "r1" },
    )

    expect(result).toEqual({ allowed: false })
  })

  it("permite acesso quando usuario pode gerenciar", async () => {
    const result = await ensureItemsLayoutAccessUseCase(
      {
        sessionService: { getCurrentUserId: vi.fn().mockResolvedValue("u1") },
        permissionService: { canManageRpg: vi.fn().mockResolvedValue(true) },
      },
      { rpgId: "r1" },
    )

    expect(result).toEqual({ allowed: true })
  })
})
