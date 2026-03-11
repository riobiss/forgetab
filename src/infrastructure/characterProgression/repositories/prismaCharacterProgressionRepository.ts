import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type {
  CharacterProgressionRepository,
  CharacterProgressionSummary,
} from "@/application/characterProgression/ports/CharacterProgressionRepository"

type CharacterRow = CharacterProgressionSummary

export const prismaCharacterProgressionRepository: CharacterProgressionRepository = {
  async findById(characterId) {
    const rows = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      SELECT
        c.id,
        c.rpg_id AS "rpgId",
        c.character_type AS "characterType",
        COALESCE(r.progression_mode, 'xp_level') AS "progressionMode",
        COALESCE(r.progression_tiers, '[{"label":"Level 1","required":0}]'::jsonb) AS "progressionTiers",
        COALESCE(c.progression_current, 0) AS "progressionCurrent"
      FROM rpg_characters c
      INNER JOIN rpgs r ON r.id = c.rpg_id
      WHERE c.id = ${characterId}
      LIMIT 1
    `)

    return rows[0] ?? null
  },

  async updateSkillPoints(characterId, amount) {
    const rows = await prisma.$queryRaw<Array<{ skillPoints: number }>>(Prisma.sql`
      UPDATE rpg_characters
      SET
        skill_points = GREATEST(0, skill_points + ${amount}),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${characterId}
      RETURNING skill_points AS "skillPoints"
    `)

    return {
      skillPoints: rows[0]?.skillPoints ?? 0,
    }
  },

  async updateProgression(params) {
    const rows = await prisma.$queryRaw<
      Array<{
        progressionCurrent: number
        progressionLabel: string
        progressionRequired: number
      }>
    >(Prisma.sql`
      UPDATE rpg_characters
      SET
        progression_current = ${params.progressionCurrent},
        progression_label = ${params.progressionLabel},
        progression_required = ${params.progressionRequired},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.characterId}
      RETURNING
        progression_current AS "progressionCurrent",
        progression_label AS "progressionLabel",
        progression_required AS "progressionRequired"
    `)

    return {
      progressionCurrent: rows[0]?.progressionCurrent ?? params.progressionCurrent,
      progressionLabel: rows[0]?.progressionLabel ?? params.progressionLabel,
      progressionRequired: rows[0]?.progressionRequired ?? params.progressionRequired,
    }
  },
}
