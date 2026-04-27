import { Prisma } from "../../../../../generated/prisma/client.js"
import { serializeEntityCatalogMeta } from "@/domain/entityCatalog/catalogMeta"
import { prisma } from "@/lib/prisma"
import type { RpgConfigRepository } from "@/application/rpg/config/ports/RpgConfigRepository"

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

  async listSkillTemplates(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT id, key, label, position
      FROM rpg_skill_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  },

  async replaceSkillTemplates(rpgId, items) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_skill_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (items.length === 0) return

    const rows = items.map((item, index) =>
      Prisma.sql`(${crypto.randomUUID()}, ${rpgId}, ${item.key}, ${item.label}, ${index})`,
    )

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_skill_templates (id, rpg_id, key, label, position)
      VALUES ${Prisma.join(rows)}
    `)
  },

  async listRaceTemplates(rpgId) {
    try {
      return await prisma.$queryRaw(Prisma.sql`
        SELECT id, key, label, category, position, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses", lore, catalog_meta AS "catalogMeta"
        FROM rpg_race_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (
        !(error instanceof Error) ||
        (!error.message.includes('column "lore" does not exist') &&
          !error.message.includes('column "catalog_meta" does not exist') &&
          !error.message.includes('column "category" does not exist'))
      ) {
        throw error
      }

      return prisma.$queryRaw(Prisma.sql`
        SELECT id, key, label, 'geral'::text AS category, position, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
        FROM rpg_race_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    }
  },

  async replaceRaceTemplates(rpgId, items) {
    await prisma.$transaction(async (tx) => {
      const preservedIds = items
        .map((item) => item.id?.trim())
        .filter((item): item is string => Boolean(item))

      const preservedLinks =
        preservedIds.length > 0
          ? await tx.$queryRaw<Array<{ skillId: string; raceTemplateId: string }>>(Prisma.sql`
              SELECT skill_id AS "skillId", race_template_id AS "raceTemplateId"
              FROM skill_race_links
              WHERE race_template_id IN (${Prisma.join(preservedIds)})
            `)
          : []

      await tx.$executeRaw(Prisma.sql`
        DELETE FROM rpg_race_templates
        WHERE rpg_id = ${rpgId}
      `)

      if (items.length === 0) return

      const rows = items.map((item, index) =>
        Prisma.sql`(
          ${item.id ?? crypto.randomUUID()},
          ${rpgId},
          ${item.key},
          ${item.label},
          ${item.category},
          ${JSON.stringify(item.attributeBonuses)}::jsonb,
          ${JSON.stringify(item.skillBonuses)}::jsonb,
          ${JSON.stringify(item.lore)}::jsonb,
          ${JSON.stringify(serializeEntityCatalogMeta(item.catalogMeta))}::jsonb,
          ${index}
        )`,
      )

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO rpg_race_templates (id, rpg_id, key, label, category, attribute_bonuses, skill_bonuses, lore, catalog_meta, position)
        VALUES ${Prisma.join(rows)}
      `)

      if (preservedLinks.length > 0) {
        const linkRows = preservedLinks.map((link) =>
          Prisma.sql`(${link.skillId}, ${link.raceTemplateId})`,
        )

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO skill_race_links (skill_id, race_template_id)
          VALUES ${Prisma.join(linkRows)}
          ON CONFLICT DO NOTHING
        `)
      }
    })
  },

  async listClassTemplates(rpgId) {
    try {
      return await prisma.$queryRaw(Prisma.sql`
        SELECT id, key, label, category, position, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses", catalog_meta AS "catalogMeta"
        FROM rpg_class_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('column "catalog_meta" does not exist')) {
        throw error
      }

      return prisma.$queryRaw(Prisma.sql`
        SELECT id, key, label, category, position, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
        FROM rpg_class_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    }
  },

  async replaceClassTemplates(rpgId, items) {
    await prisma.$transaction(async (tx) => {
      const preservedIds = items
        .map((item) => item.id?.trim())
        .filter((item): item is string => Boolean(item))

      const preservedLinks =
        preservedIds.length > 0
          ? await tx.$queryRaw<Array<{ skillId: string; classTemplateId: string }>>(Prisma.sql`
              SELECT skill_id AS "skillId", class_template_id AS "classTemplateId"
              FROM skill_class_links
              WHERE class_template_id IN (${Prisma.join(preservedIds)})
            `)
          : []

      await tx.$executeRaw(Prisma.sql`
        DELETE FROM rpg_class_templates
        WHERE rpg_id = ${rpgId}
      `)

      if (items.length === 0) return

      const rows = items.map((item, index) =>
        Prisma.sql`(
          ${item.id ?? crypto.randomUUID()},
          ${rpgId},
          ${item.key},
          ${item.label},
          ${item.category},
          ${JSON.stringify(item.attributeBonuses)}::jsonb,
          ${JSON.stringify(item.skillBonuses)}::jsonb,
          ${JSON.stringify(serializeEntityCatalogMeta(item.catalogMeta))}::jsonb,
          ${index}
        )`,
      )

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO rpg_class_templates (id, rpg_id, key, label, category, attribute_bonuses, skill_bonuses, catalog_meta, position)
        VALUES ${Prisma.join(rows)}
      `)

      if (preservedLinks.length > 0) {
        const linkRows = preservedLinks.map((link) =>
          Prisma.sql`(${link.skillId}, ${link.classTemplateId})`,
        )

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO skill_class_links (skill_id, class_template_id)
          VALUES ${Prisma.join(linkRows)}
          ON CONFLICT DO NOTHING
        `)
      }
    })
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

  async listCreatureTemplates(rpgId) {
    const [categories, fields] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string; key: string; label: string; position: number }>>(Prisma.sql`
        SELECT id, key, label, position
        FROM rpg_creature_template_categories
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `),
      prisma.$queryRaw<Array<{ id: string; categoryId: string; key: string; label: string; fieldType: "text" | "number"; position: number }>>(Prisma.sql`
        SELECT id, category_id AS "categoryId", key, label, COALESCE(field_type, 'text') AS "fieldType", position
        FROM rpg_creature_template_fields
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `),
    ])

    return categories.map((category) => ({
      ...category,
      fields: fields.filter((field) => field.categoryId === category.id),
    }))
  },

  async replaceCreatureTemplates(rpgId, items) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM rpg_creature_template_categories
        WHERE rpg_id = ${rpgId}
      `)

      if (items.length === 0) {
        return
      }

      const categoriesWithIds = items.map((item) => ({
        ...item,
        resolvedId: item.id ?? crypto.randomUUID(),
      }))

      const categoryRows = categoriesWithIds.map((item, index) =>
        Prisma.sql`(${item.resolvedId}, ${rpgId}, ${item.key}, ${item.label}, ${index})`,
      )

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO rpg_creature_template_categories (id, rpg_id, key, label, position)
        VALUES ${Prisma.join(categoryRows)}
      `)

      const fieldRows = categoriesWithIds.flatMap((item) => {
        return item.fields.map((field, index) =>
          Prisma.sql`(${field.id ?? crypto.randomUUID()}, ${rpgId}, ${item.resolvedId}, ${field.key}, ${field.label}, ${field.fieldType}, ${index})`,
        )
      })

      if (fieldRows.length > 0) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO rpg_creature_template_fields (id, rpg_id, category_id, key, label, field_type, position)
          VALUES ${Prisma.join(fieldRows)}
        `)
      }
    })
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
