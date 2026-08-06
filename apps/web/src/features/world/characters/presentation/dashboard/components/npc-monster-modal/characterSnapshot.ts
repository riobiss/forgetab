import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
  UpdateCharacterPayloadDto,
  UpsertCharacterPayloadDto,
} from "@/features/world/characters/application/editor"

type CharacterPayload = UpsertCharacterPayloadDto | UpdateCharacterPayloadDto

export function mergeCharacterSnapshot(
  currentCharacter: CharacterEditorSummaryDto | null,
  payload: CharacterPayload,
  serverCharacter: CharacterEditorSummaryDto,
): CharacterEditorSummaryDto {
  const baseCharacter = currentCharacter
    ? {
        ...currentCharacter,
        ...serverCharacter,
        statuses: {
          ...(currentCharacter.statuses ?? {}),
          ...(serverCharacter.statuses ?? {}),
        },
        attributes: {
          ...(currentCharacter.attributes ?? {}),
          ...(serverCharacter.attributes ?? {}),
        },
        skills: {
          ...(currentCharacter.skills ?? {}),
          ...(serverCharacter.skills ?? {}),
        },
        identity: {
          ...(currentCharacter.identity ?? {}),
          ...(serverCharacter.identity ?? {}),
        },
        characteristics: {
          ...(currentCharacter.characteristics ?? {}),
          ...(serverCharacter.characteristics ?? {}),
        },
      }
    : serverCharacter

  return {
    ...baseCharacter,
    ...(Object.prototype.hasOwnProperty.call(payload, "name") &&
    payload.name !== undefined
      ? { name: payload.name }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, "image")
      ? { image: payload.image ?? null }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, "visibility") &&
    payload.visibility !== undefined
      ? { visibility: payload.visibility }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, "progressionCurrent") &&
    payload.progressionCurrent !== undefined
      ? { progressionCurrent: payload.progressionCurrent }
      : {}),
    ...(payload.statuses
      ? {
          statuses: {
            ...(baseCharacter.statuses ?? {}),
            ...payload.statuses,
          },
        }
      : {}),
    ...(payload.attributes
      ? {
          attributes: {
            ...(baseCharacter.attributes ?? {}),
            ...payload.attributes,
          },
        }
      : {}),
    ...(payload.skills
      ? {
          skills: {
            ...(baseCharacter.skills ?? {}),
            ...payload.skills,
          },
        }
      : {}),
    ...(payload.identity
      ? {
          identity: {
            ...(baseCharacter.identity ?? {}),
            ...payload.identity,
          },
        }
      : {}),
    ...(payload.characteristics
      ? {
          characteristics: {
            ...(baseCharacter.characteristics ?? {}),
            ...payload.characteristics,
          },
        }
      : {}),
  }
}

export function upsertCharacterSnapshot(
  bootstrap: CharacterEditorBootstrapDto,
  character: CharacterEditorSummaryDto,
): CharacterEditorBootstrapDto {
  const hasCharacter = bootstrap.characters.some(
    (current) => current.id === character.id,
  )

  return {
    ...bootstrap,
    characters: hasCharacter
      ? bootstrap.characters.map((current) =>
          current.id === character.id ? character : current,
        )
      : [character, ...bootstrap.characters],
  }
}
