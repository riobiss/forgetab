import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { RpgConfigRepository } from "@/application/rpgConfig/ports/RpgConfigRepository"

export const prismaRpgConfigRepository: RpgConfigRepository = {
  async listAttributeTemplates(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT id, key, label, position
      FROM rpg_attribute_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  },

  async replaceAttributeTemplates(rpgId, items) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_attribute_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (items.length === 0) return

    const rows = items.map((item, index) =>
      Prisma.sql`(${crypto.randomUUID()}, ${rpgId}, ${item.key}, ${item.label}, ${index})`,
    )

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_attribute_templates (id, rpg_id, key, label, position)
      VALUES ${Prisma.join(rows)}
    `)
  },

  async listStatusTemplates(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT id, key, label, position
      FROM rpg_status_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  },

  async replaceStatusTemplates(rpgId, items) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_status_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (items.length === 0) return

    const rows = items.map((item, index) =>
      Prisma.sql`(${crypto.randomUUID()}, ${rpgId}, ${item.key}, ${item.label}, ${index})`,
    )

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_status_templates (id, rpg_id, key, label, position)
      VALUES ${Prisma.join(rows)}
    `)
  },

  async listRaceTemplates(rpgId) {
    try {
      return await prisma.$queryRaw(Prisma.sql`
        SELECT id, key, label, position, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses", lore
        FROM rpg_race_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('column "lore" does not exist')) {
        throw error
      }

      return prisma.$queryRaw(Prisma.sql`
        SELECT id, key, label, position, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
        FROM rpg_race_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    }
  },

  async replaceRaceTemplates(rpgId, items) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_race_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (items.length === 0) return

    const rows = items.map((item, index) =>
      Prisma.sql`(
        ${crypto.randomUUID()},
        ${rpgId},
        ${item.key},
        ${item.label},
        ${JSON.stringify(item.attributeBonuses)}::jsonb,
        ${JSON.stringify(item.skillBonuses)}::jsonb,
        ${JSON.stringify(item.lore)}::jsonb,
        ${index}
      )`,
    )

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_race_templates (id, rpg_id, key, label, attribute_bonuses, skill_bonuses, lore, position)
      VALUES ${Prisma.join(rows)}
    `)
  },

  async listClassTemplates(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT id, key, label, category, position, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
      FROM rpg_class_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  },

  async replaceClassTemplates(rpgId, items) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_class_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (items.length === 0) return

    const rows = items.map((item, index) =>
      Prisma.sql`(
        ${crypto.randomUUID()},
        ${rpgId},
        ${item.key},
        ${item.label},
        ${item.category},
        ${JSON.stringify(item.attributeBonuses)}::jsonb,
        ${JSON.stringify(item.skillBonuses)}::jsonb,
        ${index}
      )`,
    )

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_class_templates (id, rpg_id, key, label, category, attribute_bonuses, skill_bonuses, position)
      VALUES ${Prisma.join(rows)}
    `)
  },

  async listIdentityTemplates(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT id, key, label, required, position
      FROM rpg_character_identity_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  },

  async replaceIdentityTemplates(rpgId, items) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_character_identity_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (items.length === 0) return

    const rows = items.map((item, index) =>
      Prisma.sql`(${crypto.randomUUID()}, ${rpgId}, ${item.key}, ${item.label}, ${item.required}, ${index})`,
    )

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_character_identity_templates (id, rpg_id, key, label, required, position)
      VALUES ${Prisma.join(rows)}
    `)
  },

  async listCharacteristicTemplates(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT id, key, label, required, position
      FROM rpg_character_characteristic_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  },

  async replaceCharacteristicTemplates(rpgId, items) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_character_characteristic_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (items.length === 0) return

    const rows = items.map((item, index) =>
      Prisma.sql`(${crypto.randomUUID()}, ${rpgId}, ${item.key}, ${item.label}, ${item.required}, ${index})`,
    )

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_character_characteristic_templates (id, rpg_id, key, label, required, position)
      VALUES ${Prisma.join(rows)}
    `)
  },

  async listAttributeKeys(rpgId) {
    try {
      const rows = await prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
        SELECT key
        FROM rpg_attribute_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
      return rows.map((item) => item.key)
    } catch (error) {
      if (error instanceof Error && error.message.includes('relation "rpg_attribute_templates" does not exist')) {
        return []
      }
      throw error
    }
  },

  async listSkillKeys(rpgId) {
    try {
      const rows = await prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
        SELECT key
        FROM rpg_skill_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
      return rows.map((item) => item.key)
    } catch (error) {
      if (error instanceof Error && error.message.includes('relation "rpg_skill_templates" does not exist')) {
        return []
      }
      throw error
    }
  },
}

