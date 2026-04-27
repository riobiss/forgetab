import type { CreaturesDependencies } from "@/application/creatures"
import { httpCreaturesGateway } from "@/infrastructure/creatures/gateways/httpCreaturesGateway"

export type CreaturesGatewayFactory = "http"

export function createCreaturesDependencies(
  factory: CreaturesGatewayFactory = "http",
): CreaturesDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpCreaturesGateway }
  }
}
