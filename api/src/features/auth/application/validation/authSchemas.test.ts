import { describe, expect, it } from "vitest"
import { loginSchema, registerSchema } from "./authSchemas"

describe("registerSchema", () => {
  it("aceita um cadastro valido", () => {
    const result = registerSchema.safeParse({
      name: "Maria Silva",
      username: "maria_1",
      email: "maria@example.com",
      password: "segredo123"
    })

    expect(result.success).toBe(true)
  })

  it("rejeita username fora do formato", () => {
    const result = registerSchema.safeParse({
      name: "Maria Silva",
      username: "Maria Silva",
      email: "maria@example.com",
      password: "segredo123"
    })

    expect(result.success).toBe(false)
  })
})

describe("loginSchema", () => {
  it("rejeita email invalido", () => {
    const result = loginSchema.safeParse({
      email: "email-invalido",
      password: "segredo123"
    })

    expect(result.success).toBe(false)
  })
})
