import { afterEach, describe, expect, it } from "vitest"
import { browserAuthSession, getBrowserAuthToken } from "./browserAuthSession"

describe("browserAuthSession", () => {
  afterEach(() => {
    browserAuthSession.clear()
  })

  it("persiste e recupera o token da sessao", () => {
    browserAuthSession.persist("token com espaco", 120)

    expect(getBrowserAuthToken()).toBe("token com espaco")
  })

  it("remove o token da sessao", () => {
    browserAuthSession.persist("token", 120)
    browserAuthSession.clear()

    expect(getBrowserAuthToken()).toBeNull()
  })
})
