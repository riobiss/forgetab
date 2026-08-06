import type {
  AuthClientDependencies,
  LoginPayload,
  RegisterPayload,
} from "@/features/auth/application/contracts/AuthClientGateway"

export async function loginClientUseCase(
  deps: AuthClientDependencies,
  payload: LoginPayload,
) {
  const result = await deps.gateway.login(payload)
  deps.session.persist(result.token, result.maxAge)
  return result
}

export async function registerClientUseCase(
  deps: AuthClientDependencies,
  payload: RegisterPayload,
) {
  const result = await deps.gateway.register(payload)
  deps.session.persist(result.token, result.maxAge)
  return result
}

export async function logoutClientUseCase(deps: AuthClientDependencies) {
  try {
    await deps.gateway.logout()
  } finally {
    deps.session.clear()
  }
}
