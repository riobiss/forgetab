import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
}))

vi.mock("@/features/http/infrastructure/apiFetch", () => ({
  apiFetch: mocks.apiFetch,
}))

import { httpItemsDashboardGateway } from "./httpItemsDashboardGateway"

describe("httpItemsDashboardGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("codifica os identificadores usados na URL", async () => {
    mocks.apiFetch.mockResolvedValue(
      new Response(JSON.stringify({ item: { id: "item/1" } }), {
        status: 200,
      }),
    )

    await httpItemsDashboardGateway.fetchItem("rpg/1", "item/1")

    expect(mocks.apiFetch).toHaveBeenCalledWith(
      "/api/rpg/rpg%2F1/items/item%2F1",
    )
  })

  it("preserva a mensagem de erro retornada pela API", async () => {
    mocks.apiFetch.mockResolvedValue(
      new Response(JSON.stringify({ message: "Item nao encontrado." }), {
        status: 404,
      }),
    )

    await expect(
      httpItemsDashboardGateway.fetchItem("rpg-1", "item-1"),
    ).rejects.toThrow("Item nao encontrado.")
  })

  it("rejeita resposta de sucesso que nao seja JSON", async () => {
    mocks.apiFetch.mockResolvedValue(
      new Response("<html>proxy error</html>", { status: 200 }),
    )

    await expect(
      httpItemsDashboardGateway.fetchDashboardData("rpg-1"),
    ).rejects.toThrow("Resposta invalida da API.")
  })
})
