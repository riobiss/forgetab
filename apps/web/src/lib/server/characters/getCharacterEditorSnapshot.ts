import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { CharacterRow } from "./types"

export async function getCharacterEditorSnapshot(
  rpgId: string,
  characterId: string,
): Promise<CharacterRow | null> {
  const rows = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
    SELECT
      c.id,
      c.rpg_id AS "rpgId",
      c.name,
      c.image,
      c.race_key AS "raceKey",
      c.class_key AS "classKey",
      c.character_type AS "characterType",
      c.visibility,
      c.max_carry_weight AS "maxCarryWeight",
      COALESCE(c.progression_mode, 'xp_level') AS "progressionMode",
      COALESCE(c.progression_label, 'Level 1') AS "progressionLabel",
      COALESCE(c.progression_required, 0) AS "progressionRequired",
      COALESCE(c.progression_current, 0) AS "progressionCurrent",
      c.created_by_user_id AS "createdByUserId",
      c.life,
      c.defense,
      c.mana,
      c.stamina AS exhaustion,
      c.sanity,
      c.statuses,
      COALESCE(c.current_statuses, '{}'::jsonb) AS "currentStatuses",
      c.attributes,
      c.skills,
      COALESCE(c.identity, '{}'::jsonb) AS identity,
      COALESCE(c.characteristics, '{}'::jsonb) AS characteristics,
      c.created_at AS "createdAt",
      c.updated_at AS "updatedAt"
    FROM rpg_characters c
    WHERE c.id = ${characterId}
      AND c.rpg_id = ${rpgId}
    LIMIT 1
  `)

  return rows[0] ?? null
}
