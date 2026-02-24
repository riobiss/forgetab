import { describe, expect, it } from "vitest"
import { loginSchema, registerSchema } from "./auth"

describe("registerSchema", () => {
  it("valida payload correto", () => {
    const result = registerSchema.safeParse({
      name: "Mestre",
      username: "mestre_01",
      email: "mestre@email.com",
      password: "12345678",
    })

    expect(result.success).toBe(true)
  })

  it("rejeita username com maiusculas e simbolos invalidos", () => {
    const result = registerSchema.safeParse({
      name: "Mestre",
      username: "Mestre-01",
      email: "mestre@email.com",
      password: "12345678",
    })

    expect(result.success).toBe(false)
  })
})

describe("loginSchema", () => {
  it("rejeita senha vazia", () => {
    const result = loginSchema.safeParse({
      email: "user@email.com",
      password: "",
    })

    expect(result.success).toBe(false)
  })
})
