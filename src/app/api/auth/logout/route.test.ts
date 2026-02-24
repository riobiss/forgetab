import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/auth/token", () => ({
  TOKEN_COOKIE_NAME: "auth_token",
}))

import { POST } from "./route"

describe("POST /api/auth/logout", () => {
  it("limpa cookie de autenticacao", async () => {
    const response = await POST()
    const setCookie = response.headers.get("set-cookie") ?? ""

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(setCookie).toContain("auth_token=")
    expect(setCookie).toContain("Max-Age=0")
  })
})
