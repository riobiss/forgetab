import type { LibraryDependencies } from "@/application/library/contracts/LibraryDependencies"
import { httpLibraryGateway } from "@/infrastructure/library/gateways/httpLibraryGateway"

export type LibraryGatewayFactory = "http"

export function createLibraryDependencies(
  factory: LibraryGatewayFactory = "http",
): LibraryDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpLibraryGateway }
  }
}
