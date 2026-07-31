import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { CharacterUpdateRepository } from "@/features/world/character/application/ports/CharacterUpdateRepository"
import { getCharacterSnapshotById } from "@/features/world/character/infrastructure/repositories/prismaCharacterSnapshotRepository"
import { withCharacterPersistenceErrors } from "@/features/world/character/infrastructure/repositories/characterPersistenceErrors"

export const prismaCharacterUpdateRepository: CharacterUpdateRepository = {
  findById: getCharacterSnapshotById,

  async update(command) {
    return withCharacterPersistenceErrors(async () => {
      const hasStatuses = command.statuses !== null
      const hasAttributes = command.attributes !== null
      const hasSkills = command.skills !== null
      const coreStatuses = command.statuses ?? {}

      const updated = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE rpg_characters
        SET
          name = ${command.name},
          image = CASE WHEN ${command.hasImage} THEN ${command.image} ELSE image END,
          race_key = CASE WHEN ${command.hasRaceKey} THEN ${command.raceKey} ELSE race_key END,
          class_key = CASE WHEN ${command.hasClassKey} THEN ${command.classKey} ELSE class_key END,
          visibility = COALESCE(${command.visibility}::"RpgVisibility", visibility),
          max_carry_weight = CASE
            WHEN ${command.hasMaxCarryWeight} THEN ${command.maxCarryWeight}
            ELSE max_carry_weight
          END,
          progression_mode = ${command.progressionMode},
          progression_label = ${command.progressionLabel},
          progression_required = ${command.progressionRequired},
          progression_current = ${command.progressionCurrent},
          life = CASE WHEN ${hasStatuses} THEN ${coreStatuses.life ?? 0} ELSE life END,
          defense = CASE WHEN ${hasStatuses} THEN ${coreStatuses.defense ?? 0} ELSE defense END,
          mana = CASE WHEN ${hasStatuses} THEN ${coreStatuses.mana ?? 0} ELSE mana END,
          stamina = CASE WHEN ${hasStatuses} THEN ${coreStatuses.exhaustion ?? 0} ELSE stamina END,
          sanity = CASE WHEN ${hasStatuses} THEN ${coreStatuses.sanity ?? 0} ELSE sanity END,
          statuses = CASE
            WHEN ${hasStatuses} THEN ${JSON.stringify(command.statuses ?? {})}::jsonb
            ELSE statuses
          END,
          current_statuses = CASE
            WHEN ${hasStatuses} THEN ${JSON.stringify(command.currentStatuses ?? {})}::jsonb
            ELSE current_statuses
          END,
          attributes = CASE
            WHEN ${hasAttributes} THEN ${JSON.stringify(command.attributes ?? {})}::jsonb
            ELSE attributes
          END,
          skills = CASE
            WHEN ${hasSkills} THEN ${JSON.stringify(command.skills ?? {})}::jsonb
            ELSE skills
          END,
          identity = ${JSON.stringify(command.identity)}::jsonb,
          characteristics = ${JSON.stringify(command.characteristics)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${command.characterId}
          AND rpg_id = ${command.rpgId}
        RETURNING id
      `)

      return updated.length > 0
    })
  },
}
