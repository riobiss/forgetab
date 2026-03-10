import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useMembersList } from "@/presentation/rpg-dashboard/hooks/useMembersList"
import type { RpgDashboardDependencies } from "@/presentation/rpg-dashboard/dependencies"

const refreshMock = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}))

function createDeps(): RpgDashboardDependencies {
  return {
    gateway: {
      requestToJoinRpg: vi.fn(),
      processMemberRequest: vi.fn().mockResolvedValue({ message: "ok" }),
      processCharacterRequest: vi.fn(),
      expelMember: vi.fn().mockResolvedValue({ message: "ok" }),
      fetchCharacters: vi.fn().mockResolvedValue({
        characters: [
          {
            id: "char-1",
            name: "Aria",
            classKey: "mage",
            characterType: "player",
            createdByUserId: "user-1",
          },
        ],
      }),
      fetchClasses: vi.fn().mockResolvedValue({
        classes: [{ key: "mage", label: "Maga" }],
      }),
      fetchRpg: vi.fn().mockResolvedValue({
        rpg: { costResourceName: "Pontos de Skill" },
      }),
      grantPoints: vi.fn().mockResolvedValue({
        success: true,
        remainingPoints: 7,
      }),
      grantXp: vi.fn().mockResolvedValue({
        success: true,
        progressionLabel: "Level 2",
        progressionCurrent: 10,
        progressionRequired: 20,
      }),
    },
  }
}

describe("useMembersList", () => {
  it("loadActionData monta playerByUserId e costResourceName", async () => {
    const deps = createDeps()
    const { result } = renderHook(() => useMembersList(deps, { rpgId: "rpg-1" }))

    await act(async () => {
      await result.current.loadActionData()
    })

    expect(result.current.playerByUserId).toEqual({
      "user-1": { characterId: "char-1", classLabel: "Maga" },
    })
    expect(result.current.costResourceName).toBe("Pontos de Skill")
  })

  it("handleGrantPoints define mensagem de sucesso", async () => {
    const deps = createDeps()
    const { result } = renderHook(() => useMembersList(deps, { rpgId: "rpg-1" }))

    await act(async () => {
      await result.current.loadActionData()
    })

    await act(async () => {
      await result.current.handleGrantPoints(
        { id: "m-1", userId: "user-1", userName: "Aria" },
        1,
      )
    })

    await waitFor(() => {
      expect(result.current.actionMessage).toContain("Aria recebeu 1 Pontos de Skill.")
    })
  })
})
