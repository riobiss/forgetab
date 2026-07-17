import type { ItemsEditorDependencies } from "@/features/world/items/application/editor/contracts/ItemsEditorDependencies"
import { httpItemsEditorGateway } from "@/features/world/items/infrastructure/editor/gateways/httpItemsEditorGateway"

export type ItemsEditorGatewayFactory = "http"

export function createItemsEditorDependencies(
  factory: ItemsEditorGatewayFactory = "http",
): ItemsEditorDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpItemsEditorGateway }
  }
}
