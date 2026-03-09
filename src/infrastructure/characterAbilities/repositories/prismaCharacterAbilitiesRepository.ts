import type { CharacterAbilitiesRepository } from "@/application/characterAbilities/ports/CharacterAbilitiesRepository"
import type {
  CharacterAbilitiesCharacterRow,
  CharacterAbilitiesClassRow,
  CharacterAbilitiesPurchasedSkillLevelRow,
  CharacterAbilitiesSkillClassLinkRow,
  CharacterAbilitiesSkillRaceLinkRow,
} from "@/application/characterAbilities/types"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../generated/prisma/client.js"

export const prismaCharacterAbilitiesRepository: CharacterAbilitiesRepository = {
  async getRpg(rpgId: string) {
    return prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true, visibility: true },
    })
  },

  async getCharacter(rpgId: string, characterId: string): Promise<CharacterAbilitiesCharacterRow | null> {
    const rows = await prisma.$queryRaw<CharacterAbilitiesCharacterRow[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        name,
        class_key AS "classKey",
        visibility,
        character_type AS "characterType",
        created_by_user_id AS "createdByUserId",
        COALESCE(abilities, '[]'::jsonb) AS abilities
      FROM rpg_characters
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)

    return rows[0] ?? null
  },

  async getClassByKey(rpgId: string, classKey: string): Promise<CharacterAbilitiesClassRow | null> {
    const rows = await prisma.$queryRaw<CharacterAbilitiesClassRow[]>(Prisma.sql`
      SELECT id, key, label
      FROM rpg_class_templates
      WHERE rpg_id = ${rpgId}
        AND (
          key = ${classKey}
          OR id = ${classKey}
        )
      LIMIT 1
    `)

    return rows[0] ?? null
  },

  async listPurchasedSkillLevels(rpgId: string, ownedSkillIds: string[]) {
    try {
      return await prisma.$queryRaw<CharacterAbilitiesPurchasedSkillLevelRow[]>(Prisma.sql`
        SELECT
          s.id AS "skillId",
          s.slug AS "skillName",
          NULL::text AS "skillDescription",
          NULL::text AS "skillCategory",
          NULL::text AS "skillType",
          NULL::text AS "skillActionType",
          COALESCE(s.tags, ARRAY[]::text[]) AS "skillTags",
          sl.level_number AS "levelNumber",
          sl.level_required AS "levelRequired",
          sl.summary,
          sl.stats,
          sl.cost,
          sl.target,
          sl.area,
          sl.scaling,
          sl.requirement
        FROM skills s
        INNER JOIN skill_levels sl ON sl.skill_id = s.id
        WHERE s.rpg_id = ${rpgId}
          AND s.id IN (${Prisma.join(ownedSkillIds)})
      `)
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('column "tags" does not exist')) {
        throw error
      }

      return prisma.$queryRaw<CharacterAbilitiesPurchasedSkillLevelRow[]>(Prisma.sql`
        SELECT
          s.id AS "skillId",
          s.slug AS "skillName",
          NULL::text AS "skillDescription",
          NULL::text AS "skillCategory",
          NULL::text AS "skillType",
          NULL::text AS "skillActionType",
          ARRAY[]::text[] AS "skillTags",
          sl.level_number AS "levelNumber",
          sl.level_required AS "levelRequired",
          sl.summary,
          sl.stats,
          sl.cost,
          sl.target,
          sl.area,
          sl.scaling,
          sl.requirement
        FROM skills s
        INNER JOIN skill_levels sl ON sl.skill_id = s.id
        WHERE s.rpg_id = ${rpgId}
          AND s.id IN (${Prisma.join(ownedSkillIds)})
      `)
    }
  },

  listSkillClassLinks(rpgId: string, ownedSkillIds: string[]) {
    return prisma.$queryRaw<CharacterAbilitiesSkillClassLinkRow[]>(Prisma.sql`
      SELECT
        scl.skill_id AS "skillId",
        ct.label AS "classLabel"
      FROM skill_class_links scl
      INNER JOIN rpg_class_templates ct ON ct.id = scl.class_template_id
      WHERE scl.skill_id IN (${Prisma.join(ownedSkillIds)})
        AND ct.rpg_id = ${rpgId}
    `)
  },

  listSkillRaceLinks(rpgId: string, ownedSkillIds: string[]) {
    return prisma.$queryRaw<CharacterAbilitiesSkillRaceLinkRow[]>(Prisma.sql`
      SELECT
        srl.skill_id AS "skillId",
        rt.label AS "raceLabel"
      FROM skill_race_links srl
      INNER JOIN rpg_race_templates rt ON rt.id = srl.race_template_id
      WHERE srl.skill_id IN (${Prisma.join(ownedSkillIds)})
        AND rt.rpg_id = ${rpgId}
    `)
  },
}
