import type { NpcMonsterLoadoutDependencies } from "@/application/npcMonsterLoadout/contracts/NpcMonsterLoadoutDependencies"
import { httpNpcMonsterLoadoutGateway } from "@/infrastructure/npcMonsterLoadout/gateways/httpNpcMonsterLoadoutGateway"

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
