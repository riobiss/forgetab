import type { RpgEditorDependencies } from "@/application/rpgEditor/contracts/RpgEditorDependencies"
import { httpRpgEditorGateway } from "@/infrastructure/rpgEditor/gateways/httpRpgEditorGateway"

export type RpgEditorGatewayFactory = "http"

export function createRpgEditorDependencies(
  factory: RpgEditorGatewayFactory = "http",
): RpgEditorDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpRpgEditorGateway }
  }
}
