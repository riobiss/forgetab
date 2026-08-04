import { httpProfileGateway } from "@/features/profile/infrastructure/gateways/httpProfileGateway"

export const profileDependencies = { gateway: httpProfileGateway } as const
