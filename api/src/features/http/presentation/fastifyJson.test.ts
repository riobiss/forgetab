import { describe, expect, it } from "vitest"
import { parseJsonBody } from "./fastifyJson"

describe("parseJsonBody", () => {
  it("le JSON recebido como buffer", () => {
    expect(parseJsonBody(Buffer.from('{"ok":true}'))).toEqual({ ok: true })
  })

  it("classifica JSON malformado como erro de cliente", () => {
    expect(() => parseJsonBody("{invalido")).toThrow(
      expect.objectContaining({ status: 400, message: "JSON invalido." })
    )
  })
})
