import type { FastifyReply } from "fastify"
import { writeError, writeJson } from "@/features/http/presentation/fastifyJson"

export function mapCharacterInventoryError(
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string
) {
  if (
    error instanceof Error &&
    error.message.includes(
      'relation "rpg_character_inventory_items" does not exist'
    )
  ) {
    return writeJson(reply, 500, {
      message: "Tabela de inventario nao existe no banco. Rode a migration."
    })
  }

  if (
    error instanceof Error &&
    (error.message.includes('column "description" does not exist') ||
      error.message.includes('column "pre_requirement" does not exist') ||
      error.message.includes('column "duration" does not exist') ||
      error.message.includes('column "image" does not exist'))
  ) {
    return writeJson(reply, 500, {
      message:
        "Estrutura de itens desatualizada. Rode a migration mais recente."
    })
  }

  return writeError(reply, error, fallbackMessage)
}

export function mapCharacterCollectionError(
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string
) {
  if (
    error instanceof Error &&
    (error.message.includes(
      'column "use_inventory_weight_limit" does not exist'
    ) ||
      error.message.includes(
        'column "allow_multiple_player_characters" does not exist'
      ) ||
      error.message.includes('column "progression_mode" does not exist') ||
      error.message.includes('column "progression_tiers" does not exist'))
  ) {
    return writeJson(reply, 500, {
      message: "Estrutura de RPG desatualizada. Rode a migration mais recente."
    })
  }

  return writeError(reply, error, fallbackMessage)
}
