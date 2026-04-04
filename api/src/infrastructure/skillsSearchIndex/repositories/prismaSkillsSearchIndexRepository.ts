import { Prisma } from "../../../../generated/prisma/client.js"
import type { SkillsSearchIndexRepository } from "@/application/skillsSearchIndex/ports/SkillsSearchIndexRepository"
import type { SkillSearchIndexRow } from "@/application/skillsSearchIndex/types"
import { prisma } from "@/lib/prisma"

export const prismaSkillsSearchIndexRepository: SkillsSearchIndexRepository = {
  async listSkillRows(params) {
    try {
      return await prisma.$queryRaw<SkillSearchIndexRow[]>(Prisma.sql`
        SELECT
          s.id AS "skillId",
          s.slug AS "slug",
          COALESCE(s.tags, ARRAY[]::text[]) AS tags,
          sl.level_number AS "levelNumber",
          sl.stats AS "stats"
        FROM skills s
        LEFT JOIN skill_levels sl ON sl.skill_id = s.id
        WHERE s.owner_id = ${params.userId}
          AND s.id IN (${Prisma.join(params.skillIds)})
          ${params.rpgId ? Prisma.sql`AND s.rpg_id = ${params.rpgId}` : Prisma.sql``}
        ORDER BY s.updated_at DESC, sl.level_number ASC
      `)
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes('column "tags" does not exist')
      ) {
        throw error
      }

      return prisma.$queryRaw<SkillSearchIndexRow[]>(Prisma.sql`
        SELECT
          s.id AS "skillId",
          s.slug AS "slug",
          ARRAY[]::text[] AS tags,
          sl.level_number AS "levelNumber",
          sl.stats AS "stats"
        FROM skills s
        LEFT JOIN skill_levels sl ON sl.skill_id = s.id
        WHERE s.owner_id = ${params.userId}
          AND s.id IN (${Prisma.join(params.skillIds)})
          ${params.rpgId ? Prisma.sql`AND s.rpg_id = ${params.rpgId}` : Prisma.sql``}
        ORDER BY s.updated_at DESC, sl.level_number ASC
      `)
    }
  },
}
