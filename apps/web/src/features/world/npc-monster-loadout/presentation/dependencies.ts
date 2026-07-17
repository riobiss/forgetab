import type { NpcMonsterLoadoutDependencies } from "@/features/world/npc-monster-loadout/application/contracts/NpcMonsterLoadoutDependencies"
import { httpNpcMonsterLoadoutGateway } from "@/features/world/npc-monster-loadout/infrastructure/gateways/httpNpcMonsterLoadoutGateway"

export type NpcMonsterLoadoutGatewayFactory = "http"

export function createNpcMonsterLoadoutDependencies(
  factory: NpcMonsterLoadoutGatewayFactory = "http",
): NpcMonsterLoadoutDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpNpcMonsterLoadoutGateway }
  }
}
