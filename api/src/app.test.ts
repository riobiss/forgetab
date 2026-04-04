import { afterEach, describe, expect, it } from "vitest"
import { buildApiServer } from "@api/app"

describe("buildApiServer", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("responde healthcheck", async () => {
    server = buildApiServer()

    const response = await server.inject({
      method: "GET",
      url: "/api/health",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true, service: "forgetab-api" })
  })

  it("responde preflight com cors", async () => {
    server = buildApiServer()

    const response = await server.inject({
      method: "OPTIONS",
      url: "/api/health",
      headers: {
        origin: "http://localhost:3000",
        "access-control-request-method": "GET",
      },
    })

    expect(response.statusCode).toBe(204)
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000")
  })

  it("mantem 404 json para rota desconhecida", async () => {
    server = buildApiServer()

    const response = await server.inject({
      method: "GET",
      url: "/api/nao-existe",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "Rota nao encontrada." })
  })
})
