import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchRpgPageAccess: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
}))

vi.mock("@/infrastructure/rpgManagement/repositories/httpRpgPageAccessRepository", () => {
  class HttpPageAccessError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message)
      this.name = "HttpPageAccessError"
    }
  }

  return {
    fetchRpgPageAccess: mocks.fetchRpgPageAccess,
    HttpPageAccessError,
  }
})

import ItemsLayout from "./layout"
import { HttpPageAccessError } from "@/infrastructure/rpgManagement/repositories/httpRpgPageAccessRepository"

describe("ItemsLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchRpgPageAccess.mockResolvedValue({
      id: "rpg-1",
      title: "Campanha",
      canManage: true,
    })
  })

  it("renderiza filhos quando usuario pode gerenciar o rpg", async () => {
    render(
      await ItemsLayout({
        children: <div data-testid="items-page" />,
        params: Promise.resolve({ rpgId: "rpg-1" }),
      }),
    )

    expect(screen.getByTestId("items-page")).toBeInTheDocument()
    expect(mocks.fetchRpgPageAccess).toHaveBeenCalledWith("rpg-1")
  })

  it("retorna notFound quando usuario nao pode gerenciar o rpg", async () => {
    mocks.fetchRpgPageAccess.mockResolvedValueOnce({
      id: "rpg-1",
      title: "Campanha",
      canManage: false,
    })

    await expect(
      ItemsLayout({
        children: <div />,
        params: Promise.resolve({ rpgId: "rpg-1" }),
      }),
    ).rejects.toThrow("NOT_FOUND")
  })

  it("retorna notFound para erro de acesso da API", async () => {
    mocks.fetchRpgPageAccess.mockRejectedValueOnce(new HttpPageAccessError("Nao autorizado.", 401))

    await expect(
      ItemsLayout({
        children: <div />,
        params: Promise.resolve({ rpgId: "rpg-1" }),
      }),
    ).rejects.toThrow("NOT_FOUND")
  })
})
