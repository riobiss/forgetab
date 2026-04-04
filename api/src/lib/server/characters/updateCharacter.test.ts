import { describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  updateCharacter: vi.fn(),
}))

vi.mock("@/infrastructure/characters/services/legacyCharacterManagementService", () => ({
  legacyCharacterManagementService: {
    updateCharacter: mocks.updateCharacter,
  },
}))

import { updateCharacter } from "./updateCharacter"

describe("updateCharacter legacy adapter", () => {
  it("delegates to the infrastructure management service", async () => {
    mocks.updateCharacter.mockResolvedValueOnce(undefined)

    await expect(
      updateCharacter({
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
        payload: { name: "Goblin Rei" },
      }),
    ).resolves.toBeUndefined()

    expect(mocks.updateCharacter).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      characterId: "char-1",
      userId: "user-1",
      payload: { name: "Goblin Rei" },
    })
  })

  it("converte AppError para UpdateCharacterError legado", async () => {
    mocks.updateCharacter.mockRejectedValueOnce(new AppError("Personagem nao encontrado.", 404))

    await expect(
      updateCharacter({
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
        payload: {},
      }),
    ).rejects.toMatchObject({
      status: 404,
      message: "Personagem nao encontrado.",
      name: "UpdateCharacterError",
    })
  })
})
