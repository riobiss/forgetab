import type {
  AuthClientGateway,
  LoginPayload,
  RegisterPayload
} from "@/features/auth/application/contracts/AuthClientGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseApiResponse } from "@/features/http/infrastructure/parseApiResponse"

async function parseResponse(response: Response) {
  const payload = await parseApiResponse<{
    message?: string
    token?: string
    maxAge?: number
  }>(response, {
    fallbackMessage: "Erro inesperado.",
    invalidResponseMessage: "Resposta de autenticacao invalida."
  })

  if (!payload.token || typeof payload.maxAge !== "number") {
    throw new Error("Resposta de autenticacao invalida.")
  }
  return {
    message: payload.message,
    token: payload.token,
    maxAge: payload.maxAge
  }
}

export const httpAuthClientGateway: AuthClientGateway = {
  async login(payload: LoginPayload) {
    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    return parseResponse(response)
  },
  async register(payload: RegisterPayload) {
    const response = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    return parseResponse(response)
  },
  async logout() {
    const response = await apiFetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store"
    })

    await parseApiResponse<{ ok: true }>(response, {
      fallbackMessage: "Nao foi possivel encerrar a sessao.",
      invalidResponseMessage: "Resposta de logout invalida."
    })
  }
}
