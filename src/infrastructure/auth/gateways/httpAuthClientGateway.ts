import type {
  AuthClientGateway,
  LoginPayload,
  RegisterPayload,
} from "@/application/auth/contracts/AuthClientGateway"

async function parseResponse(response: Response) {
  const payload = (await response.json()) as { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro inesperado.")
  }
  return payload
}

export const httpAuthClientGateway: AuthClientGateway = {
  async login(payload: LoginPayload) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    return parseResponse(response)
  },
  async register(payload: RegisterPayload) {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    return parseResponse(response)
  },
}
