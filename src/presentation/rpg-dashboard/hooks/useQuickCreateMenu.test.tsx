import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useQuickCreateMenu } from "@/presentation/rpg-dashboard/hooks/useQuickCreateMenu"
import type { RpgDashboardDependencies } from "@/presentation/rpg-dashboard/dependencies"

function createDeps(): RpgDashboardDependencies {
  return {
    gateway: {
      requestToJoinRpg: vi.fn(),
      processMemberRequest: vi.fn(),
      processCharacterRequest: vi.fn(),
      expelMember: vi.fn(),
      fetchCharacters: vi.fn().mockResolvedValue({
        characters: [
          {
            id: "char-1",
            name: "Aria",
            classKey: "mage",
            characterType: "player",
            createdByUserId: "user-1",
          },
          {
            id: "char-2",
            name: "Goblin",
            classKey: null,
            characterType: "monster",
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
        remainingPoints: 4,
      }),
      grantXp: vi.fn(),
    },
  }
}

describe("useQuickCreateMenu", () => {
  it("loadPointsPanelData carrega apenas players e configura recurso de custo", async () => {
    const deps = createDeps()
    const { result } = renderHook(() => useQuickCreateMenu(deps, { rpgId: "rpg-1" }))

    await act(async () => {
      await result.current.loadPointsPanelData()
    })

    expect(result.current.players).toEqual([
      { id: "char-1", name: "Aria", classLabel: "Maga" },
    ])
    expect(result.current.costResourceName).toBe("Pontos de Skill")
    expect(result.current.hasPlayers).toBe(true)
  })

  it("handleGrantPoint define mensagem de sucesso", async () => {
    const deps = createDeps()
    const { result } = renderHook(() => useQuickCreateMenu(deps, { rpgId: "rpg-1" }))

    await act(async () => {
      await result.current.loadPointsPanelData()
    })

    await act(async () => {
      await result.current.handleGrantPoint("char-1", "Aria", 1)
    })

    await waitFor(() => {
      expect(result.current.panelMessage).toContain("Aria recebeu 1 Pontos de Skill.")
    })
  })
})
