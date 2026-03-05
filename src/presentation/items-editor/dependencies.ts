import type { ItemsEditorDependencies } from "@/application/itemsEditor/contracts/ItemsEditorDependencies"
import { httpItemsEditorGateway } from "@/infrastructure/itemsEditor/gateways/httpItemsEditorGateway"

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
