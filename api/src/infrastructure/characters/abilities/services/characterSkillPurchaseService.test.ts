import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  update: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}))

import { characterSkillPurchaseService } from "./characterSkillPurchaseService"

describe("characterSkillPurchaseService.buySkill", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        $queryRaw: mocks.queryRaw,
        rpgCharacter: {
          update: mocks.update,
        },
      }),
    )
  })

  it("permite comprar skill sem restricoes de classe ou raca", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        ownerId: "user-1",
        createdByUserId: "user-1",
        raceKey: "elf",
        classKey: "mage",
        characterType: "player",
        skillPoints: 5,
        abilities: [],
        costsEnabled: true,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        skillId: "skill-1",
        hasClassLink: false,
        classMatched: false,
        hasRaceLink: false,
        raceMatched: false,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ levelNumber: 1, cost: { points: 2 } }])
    mocks.update.mockResolvedValue({ skillPoints: 3 })

    const result = await characterSkillPurchaseService.buySkill("char-1", "user-1", {
      skillId: "skill-1",
      level: 1,
    })

    expect(result).toEqual({ status: 200, success: true, remainingPoints: 3 })
    expect(mocks.update).toHaveBeenCalledTimes(1)
  })

  it("permite comprar skill vinculada apenas a raca", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        ownerId: "user-1",
        createdByUserId: "user-1",
        raceKey: "elf",
        classKey: "warrior",
        characterType: "player",
        skillPoints: 5,
        abilities: [],
        costsEnabled: true,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        skillId: "skill-1",
        hasClassLink: false,
        classMatched: false,
        hasRaceLink: true,
        raceMatched: true,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ levelNumber: 1, cost: { points: 1 } }])
    mocks.update.mockResolvedValue({ skillPoints: 4 })

    const result = await characterSkillPurchaseService.buySkill("char-1", "user-1", {
      skillId: "skill-1",
      level: 1,
    })

    expect(result).toEqual({ status: 200, success: true, remainingPoints: 4 })
    expect(mocks.update).toHaveBeenCalledTimes(1)
  })

  it("bloqueia compra quando skill tem restricoes e personagem nao atende nenhuma", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        ownerId: "user-1",
        createdByUserId: "user-1",
        raceKey: "human",
        classKey: "warrior",
        characterType: "player",
        skillPoints: 5,
        abilities: [],
        costsEnabled: true,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        skillId: "skill-1",
        hasClassLink: true,
        classMatched: false,
        hasRaceLink: true,
        raceMatched: false,
      },
    ])

    await expect(
      characterSkillPurchaseService.buySkill("char-1", "user-1", {
        skillId: "skill-1",
        level: 1,
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Nao e permitido comprar esta habilidade para a classe ou raca do personagem.",
    })

    expect(mocks.update).not.toHaveBeenCalled()
  })
})
