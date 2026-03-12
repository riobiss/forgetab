import type { CharacterStatusCurrentRepository } from "@/application/characterStatusCurrent/ports/CharacterStatusCurrentRepository"
import { AppError } from "@/shared/errors/AppError"

const CORE_STATUS_COLUMN_BY_KEY = {
  life: "life",
  mana: "mana",
  sanity: "sanity",
  exhaustion: "stamina",
} as const

function parseStatusKey(value: unknown): string | null {
  if (typeof value !== "string") return null
  const key = value.trim()
  return key.length > 0 ? key : null
}

async function getAccessContext(
  repository: CharacterStatusCurrentRepository,
  params: { rpgId: string; characterId: string; userId: string },
) {
  const rpg = await repository.getRpg(params.rpgId)
  if (!rpg) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  const isOwner = rpg.ownerId === params.userId
  let isModerator = false

  if (!isOwner) {
    const membership = await repository.getMembership(params.rpgId, params.userId)
    if (membership?.status !== "accepted") {
      throw new AppError("RPG nao encontrado.", 404)
    }
    isModerator = membership.role === "moderator"
  }

  const character = await repository.getCharacter(params.rpgId, params.characterId)
  if (!character) {
    throw new AppError("Personagem nao encontrado.", 404)
  }

  const canManageAsMaster = isOwner || isModerator
  if (!canManageAsMaster && character.createdByUserId !== params.userId) {
    throw new AppError("Sem permissao para editar este personagem.", 403)
  }

  return { character }
}

export async function updateCharacterStatusCurrentUseCase(
  repository: CharacterStatusCurrentRepository,
  params: {
    rpgId: string
    characterId: string
    userId: string
    body: { key?: unknown; value?: unknown }
  },
) {
  const access = await getAccessContext(repository, params)

  const key = parseStatusKey(params.body.key)
  if (!key) {
    throw new AppError("Status invalido para atualizacao.", 400)
  }

  if (typeof params.body.value !== "number" || !Number.isFinite(params.body.value)) {
    throw new AppError("Valor atual invalido.", 400)
  }

  const maxRecord =
    access.character.statuses &&
    typeof access.character.statuses === "object" &&
    !Array.isArray(access.character.statuses)
      ? (access.character.statuses as Record<string, unknown>)
      : {}

  if (!(key in maxRecord)) {
    throw new AppError("Status nao existe na ficha.", 400)
  }

  const maxValue = Number(maxRecord[key] ?? 0)
  if (!Number.isFinite(maxValue) || maxValue < 0) {
    throw new AppError("Status maximo invalido na ficha.", 400)
  }

  const nextValue = Math.floor(params.body.value)
  if (nextValue < 0 || nextValue > maxValue) {
    throw new AppError("Valor atual fora do limite permitido.", 400)
  }

  const currentRecord =
    access.character.currentStatuses &&
    typeof access.character.currentStatuses === "object" &&
    !Array.isArray(access.character.currentStatuses)
      ? (access.character.currentStatuses as Record<string, unknown>)
      : {}

  const nextCurrentStatuses = Object.entries(currentRecord).reduce<Record<string, number>>(
    (acc, [statusKey, statusValue]) => {
      if (typeof statusValue === "number" && Number.isFinite(statusValue)) {
        acc[statusKey] = Math.floor(statusValue)
      }
      return acc
    },
    {},
  )
  nextCurrentStatuses[key] = nextValue

  const updated = await repository.updateCharacterStatus(params.rpgId, params.characterId, {
    currentStatuses: nextCurrentStatuses,
    nextValue,
    coreColumn: CORE_STATUS_COLUMN_BY_KEY[key as keyof typeof CORE_STATUS_COLUMN_BY_KEY],
  })

  if (!updated) {
    throw new AppError("Personagem nao encontrado.", 404)
  }

  return {
    message: "Status atual salvo.",
    key,
    value: nextValue,
    max: maxValue,
  }
}
