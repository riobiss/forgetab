import { httpAuthClientGateway } from "@/features/auth/infrastructure/gateways/httpAuthClientGateway"
import { browserAuthSession } from "@/features/session/infrastructure/services/browserAuthSession"

export const authClientDependencies = {
  gateway: httpAuthClientGateway,
  session: browserAuthSession
} as const
