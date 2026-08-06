import type { CharactersEditorDependencies } from "@/features/world/characters/application/editor"
import { httpCharactersEditorGateway } from "@/features/world/characters/infrastructure/editor/gateways/httpCharactersEditorGateway"

export type CharactersEditorGatewayFactory = "http"

export function createCharactersEditorDependencies(
  factory: CharactersEditorGatewayFactory = "http"
): CharactersEditorDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpCharactersEditorGateway }
  }
}
