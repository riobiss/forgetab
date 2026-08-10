import { describe, expect, it } from "vitest"
import { getCookieValueFromRequest } from "./requestAuth"

describe("getCookieValueFromRequest", () => {
  it("decodifica o valor do cookie", () => {
    const request = new Request("https://example.com", {
      headers: { cookie: "auth_token=token%20value" }
    })

    expect(getCookieValueFromRequest(request, "auth_token")).toBe("token value")
  })

  it("trata cookie com escape malformado como invalido", () => {
    const request = new Request("https://example.com", {
      headers: { cookie: "auth_token=%E0%A4%A" }
    })

    expect(getCookieValueFromRequest(request, "auth_token")).toBe("")
  })
})
