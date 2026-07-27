import type { FastifyReply, FastifyRequest } from "fastify"
import { rollDicesUseCase } from "@/features/dices/application/use-cases/rollDices"
import {
  parseJsonBody,
  writeError,
  writeJson,
} from "@/features/http/presentation/fastifyJson"
import { randomOrgRandomNumberProvider } from "@/features/dices/random/infrastructure/randomOrgRandomNumberProvider"

export async function rollDicesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const body = (parseJsonBody(request.body) ?? {}) as {
      entries?: Array<{ diceCount?: unknown; diceSides?: unknown }>
    }

    const payload = await rollDicesUseCase(
      randomOrgRandomNumberProvider,
      body.entries ?? [],
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao girar dados.")
  }
}
