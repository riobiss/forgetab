import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import {
  fetchRpgAbilityCategoryConfig,
  fetchSkillById,
  fetchSkillList,
  validateLinkIds,
} from "@/lib/server/skillBuilder"
import { createRpgScope } from "@/lib/validators/skillBuilder"
import type {
  CreateSkillRecordInput,
  SkillDetails,
  SkillRepository,
} from "@/application/skills/ports/SkillRepository"

export const prismaSkillRepository: SkillRepository = {
  async listByOwner(userId, rpgId) {
    return fetchSkillList(userId, rpgId)
  },

  async getAbilityCategoryConfig(rpgId) {
    return fetchRpgAbilityCategoryConfig(rpgId)
  },

  async validateLinkIds(params) {
    return validateLinkIds(params)
  },

  async createSkillRecord(params: CreateSkillRecordInput) {
    const createdSkillId = crypto.randomUUID()
    const createdLevelId = crypto.randomUUID()
    const rpgScope = createRpgScope(params.rpgId)
    const level1 = params.level1

    await prisma.$transaction(async (tx) => {
      try {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO skills (
            id,
            owner_id,
            rpg_id,
            rpg_scope,
            slug,
            tags
          )
          VALUES (
            ${createdSkillId},
            ${params.userId},
            ${params.rpgId},
            ${rpgScope},
            ${params.slug},
            ${params.tags}
          )
        `)
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('column "tags" does not exist')) {
          throw error
        }

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO skills (
            id,
            owner_id,
            rpg_id,
            rpg_scope,
            slug
          )
          VALUES (
            ${createdSkillId},
            ${params.userId},
            ${params.rpgId},
            ${rpgScope},
            ${params.slug}
          )
        `)
      }

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO skill_levels (
          id,
          skill_id,
          level_number,
          level_required,
          summary,
          stats,
          cost,
          target,
          area,
          scaling,
          requirement
        )
        VALUES (
          ${createdLevelId},
          ${createdSkillId},
          1,
          ${level1?.levelRequired ?? 1},
          ${level1?.summary ?? null},
          ${level1?.stats ? Prisma.sql`${JSON.stringify(level1.stats)}::jsonb` : Prisma.sql`NULL`},
          ${level1?.cost ? Prisma.sql`${JSON.stringify(level1.cost)}::jsonb` : Prisma.sql`NULL`},
          ${level1?.target ? Prisma.sql`${JSON.stringify(level1.target)}::jsonb` : Prisma.sql`NULL`},
          ${level1?.area ? Prisma.sql`${JSON.stringify(level1.area)}::jsonb` : Prisma.sql`NULL`},
          ${level1?.scaling
            ? Prisma.sql`${JSON.stringify(level1.scaling)}::jsonb`
            : Prisma.sql`NULL`},
          ${level1?.requirement
            ? Prisma.sql`${JSON.stringify(level1.requirement)}::jsonb`
            : Prisma.sql`NULL`}
        )
      `)

      if (params.classIds.length > 0) {
        const classValues = params.classIds.map((classId) =>
          Prisma.sql`(${createdSkillId}, ${classId})`,
        )
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO skill_class_links (skill_id, class_template_id)
          VALUES ${Prisma.join(classValues)}
        `)
      }

      if (params.raceIds.length > 0) {
        const raceValues = params.raceIds.map((raceId) =>
          Prisma.sql`(${createdSkillId}, ${raceId})`,
        )
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO skill_race_links (skill_id, race_template_id)
          VALUES ${Prisma.join(raceValues)}
        `)
      }
    })

    return createdSkillId
  },

  async findById(skillId, ownerId) {
    return (await fetchSkillById(skillId, ownerId)) as SkillDetails | null
  },

  async updateSkillMeta(params) {
    await prisma.$transaction(async (tx) => {
      try {
        await tx.$executeRaw(Prisma.sql`
          UPDATE skills
          SET
            slug = ${params.slug},
            tags = ${params.tags},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${params.skillId}
            AND owner_id = ${params.ownerId}
        `)
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('column "tags" does not exist')) {
          throw error
        }

        await tx.$executeRaw(Prisma.sql`
          UPDATE skills
          SET
            slug = ${params.slug},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${params.skillId}
            AND owner_id = ${params.ownerId}
        `)
      }

      if (params.classIds !== undefined) {
        await tx.$executeRaw(Prisma.sql`
          DELETE FROM skill_class_links
          WHERE skill_id = ${params.skillId}
        `)

        if (params.classIds.length > 0) {
          const values = params.classIds.map((classId) => Prisma.sql`(${params.skillId}, ${classId})`)
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO skill_class_links (skill_id, class_template_id)
            VALUES ${Prisma.join(values)}
          `)
        }
      }

      if (params.raceIds !== undefined) {
        await tx.$executeRaw(Prisma.sql`
          DELETE FROM skill_race_links
          WHERE skill_id = ${params.skillId}
        `)

        if (params.raceIds.length > 0) {
          const values = params.raceIds.map((raceId) => Prisma.sql`(${params.skillId}, ${raceId})`)
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO skill_race_links (skill_id, race_template_id)
            VALUES ${Prisma.join(values)}
          `)
        }
      }
    })
  },

  async deleteSkill(skillId, ownerId) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM skill_class_links
        WHERE skill_id = ${skillId}
      `)

      await tx.$executeRaw(Prisma.sql`
        DELETE FROM skill_race_links
        WHERE skill_id = ${skillId}
      `)

      await tx.$executeRaw(Prisma.sql`
        DELETE FROM skill_levels
        WHERE skill_id = ${skillId}
      `)

      await tx.$executeRaw(Prisma.sql`
        DELETE FROM skills
        WHERE id = ${skillId}
          AND owner_id = ${ownerId}
      `)
    })
  },

  async createLevel(params) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO skill_levels (
        id,
        skill_id,
        level_number,
        level_required,
        summary,
        stats,
        cost,
        target,
        area,
        scaling,
        requirement
      )
      VALUES (
        ${crypto.randomUUID()},
        ${params.skillId},
        ${params.levelNumber},
        ${params.levelRequired},
        ${params.summary},
        ${params.stats ? Prisma.sql`${JSON.stringify(params.stats)}::jsonb` : Prisma.sql`NULL`},
        ${params.cost ? Prisma.sql`${JSON.stringify(params.cost)}::jsonb` : Prisma.sql`NULL`},
        ${params.target ? Prisma.sql`${JSON.stringify(params.target)}::jsonb` : Prisma.sql`NULL`},
        ${params.area ? Prisma.sql`${JSON.stringify(params.area)}::jsonb` : Prisma.sql`NULL`},
        ${params.scaling ? Prisma.sql`${JSON.stringify(params.scaling)}::jsonb` : Prisma.sql`NULL`},
        ${params.requirement
          ? Prisma.sql`${JSON.stringify(params.requirement)}::jsonb`
          : Prisma.sql`NULL`}
      )
    `)
  },

  async updateLevel(params) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE skill_levels
      SET
        level_required = ${params.levelRequired},
        summary = ${params.summary},
        stats = ${params.stats ? Prisma.sql`${JSON.stringify(params.stats)}::jsonb` : Prisma.sql`NULL`},
        cost = ${params.cost ? Prisma.sql`${JSON.stringify(params.cost)}::jsonb` : Prisma.sql`NULL`},
        target = ${params.target ? Prisma.sql`${JSON.stringify(params.target)}::jsonb` : Prisma.sql`NULL`},
        area = ${params.area ? Prisma.sql`${JSON.stringify(params.area)}::jsonb` : Prisma.sql`NULL`},
        scaling = ${params.scaling
          ? Prisma.sql`${JSON.stringify(params.scaling)}::jsonb`
          : Prisma.sql`NULL`},
        requirement = ${params.requirement
          ? Prisma.sql`${JSON.stringify(params.requirement)}::jsonb`
          : Prisma.sql`NULL`},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.levelId}
        AND skill_id = ${params.skillId}
    `)
  },

  async deleteLevel(skillId, levelId) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM skill_levels
      WHERE id = ${levelId}
        AND skill_id = ${skillId}
    `)
  },
}
