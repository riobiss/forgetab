import { describe, expect, it } from "vitest"
import { getClientIp } from "./clientIp"

describe("getClientIp", () => {
  it("usa o primeiro IP valido do header confiavel", () => {
    expect(
      getClientIp({
        "x-vercel-forwarded-for": "invalido, 203.0.113.10, 203.0.113.11"
      })
    ).toBe("203.0.113.10")
  })

  it("normaliza IPv4 com porta no ambiente local", () => {
    expect(getClientIp({ "x-real-ip": "127.0.0.1:4321" })).toBe("127.0.0.1")
  })

  it("nao aceita valores arbitrarios como IP", () => {
    expect(getClientIp({ "x-vercel-forwarded-for": "usuario-qualquer" })).toBe(
      "unknown"
    )
  })
})
