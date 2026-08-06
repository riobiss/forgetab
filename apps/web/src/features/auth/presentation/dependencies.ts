import { httpAuthClientGateway } from "@/features/auth/infrastructure/gateways/httpAuthClientGateway"
import { clientAuthSession } from "@/features/auth/infrastructure/session/clientAuthSession"

export const authClientDependencies = {
  gateway: httpAuthClientGateway,
  session: clientAuthSession,
} as const
