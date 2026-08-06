import type { LibraryDependencies } from "@/features/world/library/application/contracts/LibraryDependencies"
import { httpLibraryGateway } from "@/features/world/library/infrastructure/gateways/httpLibraryGateway"

export type LibraryGatewayFactory = "http"

export function createLibraryDependencies(
  factory: LibraryGatewayFactory = "http"
): LibraryDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpLibraryGateway }
  }
}
