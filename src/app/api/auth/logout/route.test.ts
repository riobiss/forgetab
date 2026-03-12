import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth/token", () => ({
  TOKEN_COOKIE_NAME: "auth_token",
  TOKEN_EXPIRES_IN_SECONDS: 604800,
  createAuthToken: vi.fn(),
}))

import { POST } from "./route"

describe("POST /api/auth/logout", () => {
  it("retorna ok e expira o cookie", async () => {
    const response = await POST()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(response.headers.get("set-cookie")).toContain("auth_token=")
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
  })
})
