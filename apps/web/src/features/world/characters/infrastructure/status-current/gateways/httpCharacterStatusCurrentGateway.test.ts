import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { httpCharacterStatusCurrentGateway } from "./httpCharacterStatusCurrentGateway"

vi.mock("@/features/http/infrastructure/apiFetch", () => ({
  apiFetch: vi.fn(),
}))

const apiFetchMock = vi.mocked(apiFetch)

describe("httpCharacterStatusCurrentGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("atualiza o currentStatuses pela API", async () => {
    apiFetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Status atual salvo.",
          key: "life",
          value: 7,
          max: 10,
        }),
        { status: 200 },
      ),
    )

    await expect(
      httpCharacterStatusCurrentGateway.update({
        rpgId: "rpg-1",
        characterId: "character-1",
        key: "life",
        value: 7,
      }),
    ).resolves.toEqual({
      message: "Status atual salvo.",
      key: "life",
      value: 7,
      max: 10,
    })

    expect(apiFetchMock).toHaveBeenCalledWith(
      "/api/rpg/rpg-1/characters/character-1/status-current",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "life", value: 7 }),
      },
    )
  })

  it("propaga a mensagem de erro retornada pela API", async () => {
    apiFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Sem permissao." }), {
        status: 403,
      }),
    )

    await expect(
      httpCharacterStatusCurrentGateway.update({
        rpgId: "rpg-1",
        characterId: "character-1",
        key: "life",
        value: 7,
      }),
    ).rejects.toThrow("Sem permissao.")
  })
})
