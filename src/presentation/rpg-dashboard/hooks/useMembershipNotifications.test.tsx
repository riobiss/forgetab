import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useMembershipNotifications } from "@/presentation/rpg-dashboard/hooks/useMembershipNotifications"
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
      requestToJoinRpg: vi.fn().mockResolvedValue({ message: "Solicitacao enviada." }),
      processMemberRequest: vi.fn().mockResolvedValue({ message: "Solicitacao aprovada." }),
      processCharacterRequest: vi.fn().mockResolvedValue({ message: "Solicitacao aprovada." }),
      expelMember: vi.fn(),
      fetchCharacters: vi.fn(),
      fetchClasses: vi.fn(),
      fetchRpg: vi.fn(),
      grantPoints: vi.fn(),
      grantXp: vi.fn(),
    },
  }
}

describe("useMembershipNotifications", () => {
  it("requestToJoin define mensagem e refresh", async () => {
    const deps = createDeps()
    const { result } = renderHook(() => useMembershipNotifications(deps, { rpgId: "rpg-1" }))

    await act(async () => {
      await result.current.requestToJoin()
    })

    await waitFor(() => {
      expect(result.current.message).toBe("Solicitacao enviada.")
      expect(refreshMock).toHaveBeenCalled()
    })
  })

  it("processRequest define erro quando gateway falha", async () => {
    const deps = createDeps()
    ;(deps.gateway.processMemberRequest as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Falha ao aprovar."),
    )

    const { result } = renderHook(() => useMembershipNotifications(deps, { rpgId: "rpg-1" }))

    await act(async () => {
      await result.current.processRequest("m-1", "accept")
    })

    expect(result.current.error).toBe("Falha ao aprovar.")
  })
})

