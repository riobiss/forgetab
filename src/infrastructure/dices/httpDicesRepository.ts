import { apiFetch } from "@/infrastructure/http/apiFetch"

export type DiceRollEntry = {
  diceCount: number
  diceSides: number
}

export type DiceRollGroup = DiceRollEntry & {
  results: number[]
  total: number
}

export type DiceRollResponse = {
  provider?: "local" | "random-org"
  groups: DiceRollGroup[]
}

type ErrorPayload = {
  message?: string
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    const text = await response.text()
    throw new Error(text || "Resposta invalida da API.")
  }

  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro ao girar dados.")
  }

  return payload
}

export const httpDicesRepository = {
  roll(payload: { entries: DiceRollEntry[] }) {
    return apiFetch("/api/dices/roll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((response) => parseJsonResponse<DiceRollResponse>(response))
  },
}
