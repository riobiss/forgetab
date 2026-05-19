import { describe, expect, it } from "vitest"
import { createLocalDicesRepository } from "@/infrastructure/dices/localDicesRepository"

describe("localDicesRepository", () => {
  it("rola dados localmente usando Math.random injetado", async () => {
    const repository = createLocalDicesRepository(() => 0.5)

    await expect(repository.roll({ entries: [{ diceCount: 3, diceSides: 6 }] })).resolves.toEqual({
      provider: "local",
      groups: [
        {
          diceCount: 3,
          diceSides: 6,
          results: [4, 4, 4],
          total: 12,
        },
      ],
    })
  })
})
