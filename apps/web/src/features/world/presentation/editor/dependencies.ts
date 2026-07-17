import type { RpgEditorDependencies } from "@/features/world/application/editor/contracts/RpgEditorDependencies"
import { httpRpgEditorGateway } from "@/features/world/infrastructure/editor/gateways/httpRpgEditorGateway"

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
