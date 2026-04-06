import type {
  AuthClientGateway,
  LoginPayload,
  RegisterPayload,
} from "@/application/auth/contracts/AuthClientGateway"
import { apiFetch } from "@/infrastructure/http/apiFetch"

async function parseResponse(response: Response) {
  const payload = (await response.json()) as {
    message?: string
    token?: string
    maxAge?: number
  }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro inesperado.")
  }
  if (!payload.token || typeof payload.maxAge !== "number") {
    throw new Error("Resposta de autenticacao invalida.")
  }
  return {
    message: payload.message,
    token: payload.token,
    maxAge: payload.maxAge,
  }
}

export const httpAuthClientGateway: AuthClientGateway = {
  async login(payload: LoginPayload) {
    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    return parseResponse(response)
  },
  async register(payload: RegisterPayload) {
    const response = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    return parseResponse(response)
  },
}
