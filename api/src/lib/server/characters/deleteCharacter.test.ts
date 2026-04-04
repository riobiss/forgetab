import { describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  deleteCharacter: vi.fn(),
}))

vi.mock("@/infrastructure/characters/services/legacyCharacterManagementService", () => ({
  legacyCharacterManagementService: {
    deleteCharacter: mocks.deleteCharacter,
  },
}))

import { deleteCharacter } from "./deleteCharacter"

describe("deleteCharacter legacy adapter", () => {
  it("delegates to the infrastructure management service", async () => {
    mocks.deleteCharacter.mockResolvedValueOnce(undefined)

    await expect(
      deleteCharacter({
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
      }),
    ).resolves.toBeUndefined()

    expect(mocks.deleteCharacter).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      characterId: "char-1",
      userId: "user-1",
    })
  })

  it("converte AppError para DeleteCharacterError legado", async () => {
    mocks.deleteCharacter.mockRejectedValueOnce(new AppError("Personagem nao encontrado.", 404))

    await expect(
      deleteCharacter({
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({
      status: 404,
      message: "Personagem nao encontrado.",
      name: "DeleteCharacterError",
    })
  })
})
