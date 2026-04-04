import { describe, expect, it, vi } from "vitest"
import type { RpgDashboardGateway } from "@/application/rpgDashboard/contracts/RpgDashboardGateway"
import {
  loadDashboardDistributionUseCase,
  mapPlayersWithClasses,
  processMemberRequestUseCase,
  requestToJoinRpgUseCase,
} from "@/application/rpgDashboard/use-cases/rpgDashboardActions"

function createGatewayMock(): RpgDashboardGateway {
  return {
    requestToJoinRpg: vi.fn().mockResolvedValue({ message: "ok" }),
    processMemberRequest: vi.fn().mockResolvedValue({ message: "ok" }),
    processCharacterRequest: vi.fn().mockResolvedValue({ message: "ok" }),
    expelMember: vi.fn().mockResolvedValue({ message: "ok" }),
    fetchCharacters: vi.fn().mockResolvedValue({ characters: [] }),
    fetchClasses: vi.fn().mockResolvedValue({ classes: [] }),
    fetchRpg: vi.fn().mockResolvedValue({ rpg: { costResourceName: "Pontos" } }),
    grantPoints: vi.fn().mockResolvedValue({ success: true, remainingPoints: 3 }),
    grantXp: vi.fn().mockResolvedValue({ success: true }),
  }
}

describe("rpgDashboardActions use-cases", () => {
  it("requestToJoinRpgUseCase delega para o gateway", async () => {
    const gateway = createGatewayMock()

    await requestToJoinRpgUseCase(gateway, { rpgId: "rpg-1" })

    expect(gateway.requestToJoinRpg).toHaveBeenCalledWith("rpg-1")
  })

  it("processMemberRequestUseCase delega com action", async () => {
    const gateway = createGatewayMock()

    await processMemberRequestUseCase(gateway, {
      rpgId: "rpg-1",
      memberId: "m-1",
      action: "accept",
    })

    expect(gateway.processMemberRequest).toHaveBeenCalledWith("rpg-1", "m-1", "accept")
  })

  it("loadDashboardDistributionUseCase agrega os tres payloads", async () => {
    const gateway = createGatewayMock()
    ;(gateway.fetchCharacters as ReturnType<typeof vi.fn>).mockResolvedValue({
      characters: [{ id: "c1", name: "Aria", classKey: "mage", characterType: "player" }],
    })
    ;(gateway.fetchClasses as ReturnType<typeof vi.fn>).mockResolvedValue({
      classes: [{ key: "mage", label: "Maga" }],
    })

    const result = await loadDashboardDistributionUseCase(gateway, { rpgId: "rpg-1" })

    expect(result.charactersPayload.characters?.[0]?.name).toBe("Aria")
    expect(result.classesPayload.classes?.[0]?.label).toBe("Maga")
    expect(result.rpgPayload.rpg?.costResourceName).toBe("Pontos")
  })

  it("mapPlayersWithClasses filtra players e resolve label de classe", () => {
    const result = mapPlayersWithClasses({
      characters: [
        {
          id: "c1",
          name: "Aria",
          classKey: "mage",
          characterType: "player",
          createdByUserId: "u1",
        },
        {
          id: "c2",
          name: "Goblin",
          classKey: null,
          characterType: "monster",
        },
      ],
      classes: [{ key: "mage", label: "Maga" }],
    })

    expect(result).toEqual([
      { id: "c1", userId: "u1", name: "Aria", classLabel: "Maga" },
    ])
  })
})

