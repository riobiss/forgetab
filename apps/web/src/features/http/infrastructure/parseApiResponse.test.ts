import { describe, expect, it } from "vitest"

import { parseApiResponse } from "./parseApiResponse"

describe("parseApiResponse", () => {
  it("retorna o JSON de uma resposta valida", async () => {
    const response = new Response(JSON.stringify({ value: 1 }), { status: 200 })

    await expect(
      parseApiResponse<{ value: number }>(response)
    ).resolves.toEqual({
      value: 1
    })
  })

  it("usa a mensagem da API em respostas de erro", async () => {
    const response = new Response(
      JSON.stringify({ message: "Nao encontrado." }),
      {
        status: 404
      }
    )

    await expect(parseApiResponse(response)).rejects.toThrow("Nao encontrado.")
  })

  it("produz erro estavel para resposta invalida", async () => {
    const response = new Response("not-json", { status: 200 })

    await expect(parseApiResponse(response)).rejects.toThrow(
      "Resposta invalida da API."
    )
  })

  it("permite preservar erros HTTP especializados", async () => {
    class TestHttpError extends Error {
      constructor(
        message: string,
        readonly status: number
      ) {
        super(message)
      }
    }

    const response = new Response(null, { status: 503 })

    await expect(
      parseApiResponse(response, {
        fallbackMessage: "Indisponivel.",
        errorFactory: (message, status) => new TestHttpError(message, status)
      })
    ).rejects.toMatchObject({ message: "Indisponivel.", status: 503 })
  })
})
