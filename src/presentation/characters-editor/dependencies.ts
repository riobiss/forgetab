import type { CharactersEditorDependencies } from "@/application/characters/editor"
import { httpCharactersEditorGateway } from "@/infrastructure/charactersEditor/gateways/httpCharactersEditorGateway"

export type CharactersEditorGatewayFactory = "http"

export function createCharactersEditorDependencies(
  factory: CharactersEditorGatewayFactory = "http",
): CharactersEditorDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpCharactersEditorGateway }
  }
}
