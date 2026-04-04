import type {
  AuthClientGateway,
  LoginPayload,
  RegisterPayload,
} from "@/application/auth/contracts/AuthClientGateway"

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
