import type {
  AuthClientGateway,
  LoginPayload,
  RegisterPayload,
} from "@/features/auth/application/contracts/AuthClientGateway"

export async function loginClientUseCase(
  deps: { gateway: AuthClientGateway },
  payload: LoginPayload,
) {
  return deps.gateway.login(payload)
}

export async function registerClientUseCase(
  deps: { gateway: AuthClientGateway },
  payload: RegisterPayload,
) {
  return deps.gateway.register(payload)
}
