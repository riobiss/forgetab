import type { FastifyReply, FastifyRequest } from "fastify"
import { AppError } from "@/shared/errors/AppError"
import { getUserIdFromFastifyRequest } from "@api/presentation/http/auth/requestAuth"

export function parseJsonBody(body: unknown) {
  if (body == null) {
    return null
  }

  if (Buffer.isBuffer(body)) {
    const raw = body.toString("utf8").trim()
    return raw ? JSON.parse(raw) : null
  }

  if (typeof body === "string") {
    const raw = body.trim()
    return raw ? JSON.parse(raw) : null
  }

  return body
}

export function writeJson(reply: FastifyReply, status: number, body: unknown) {
  reply.code(status)
  reply.header("Content-Type", "application/json; charset=utf-8")
  return reply.send(body)
}

export function writeError(reply: FastifyReply, error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return writeJson(reply, error.status, { message: error.message })
  }

  return writeJson(reply, 500, { message: fallbackMessage })
}

export function mapCharacterInventoryError(
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string,
) {
  if (
    error instanceof Error &&
    error.message.includes('relation "rpg_character_inventory_items" does not exist')
  ) {
    return writeJson(
      reply,
      500,
      { message: "Tabela de inventario nao existe no banco. Rode a migration." },
    )
  }

  if (
    error instanceof Error &&
    (error.message.includes('column "description" does not exist') ||
      error.message.includes('column "pre_requirement" does not exist') ||
      error.message.includes('column "duration" does not exist') ||
      error.message.includes('column "image" does not exist'))
  ) {
    return writeJson(
      reply,
      500,
      { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
    )
  }

  return writeError(reply, error, fallbackMessage)
}

export function mapCharacterCollectionError(
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string,
) {
  if (
    error instanceof Error &&
    (error.message.includes('column "use_inventory_weight_limit" does not exist') ||
      error.message.includes('column "allow_multiple_player_characters" does not exist') ||
      error.message.includes('column "progression_mode" does not exist') ||
      error.message.includes('column "progression_tiers" does not exist'))
  ) {
    return writeJson(
      reply,
      500,
      { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
    )
  }

  return writeError(reply, error, fallbackMessage)
}

export async function requireUserId(request: FastifyRequest, reply: FastifyReply) {
  const userId = await getUserIdFromFastifyRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: writeJson(reply, 401, { message: "Usuario nao autenticado." }),
    }
  }

  return { ok: true as const, userId }
}
