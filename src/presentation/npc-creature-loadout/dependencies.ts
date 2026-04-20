import type { NpcCreatureLoadoutDependencies } from "@/application/npcCreatureLoadout/contracts/NpcCreatureLoadoutDependencies"
import { httpNpcCreatureLoadoutGateway } from "@/infrastructure/npcCreatureLoadout/gateways/httpNpcCreatureLoadoutGateway"

export type NpcCreatureLoadoutGatewayFactory = "http"

export function createNpcCreatureLoadoutDependencies(
  factory: NpcCreatureLoadoutGatewayFactory = "http",
): NpcCreatureLoadoutDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpNpcCreatureLoadoutGateway }
  }
}
