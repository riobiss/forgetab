import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type {
  GiveItemInput,
  ItemCharacterSummary,
  ItemRecord,
  ItemRepository,
} from "@/application/items/ports/ItemRepository"

export const prismaItemRepository: ItemRepository = {
  listByRpg(rpgId) {
    return prisma.$queryRaw<ItemRecord[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        name,
        image,
        description,
        pre_requirement AS "preRequirement",
        type,
        rarity,
        damage,
        "range" AS "range",
        ability,
        ability_name AS "abilityName",
        effect,
        effect_name AS "effectName",
        abilities,
        effects,
        custom_fields AS "customFields",
        weight,
        duration,
        durability,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM baseitems
      WHERE rpg_id = ${rpgId}
      ORDER BY created_at DESC
    `)
  },

  listCharacterSummaries(rpgId) {
    return prisma.$queryRaw<ItemCharacterSummary[]>(Prisma.sql`
      SELECT
        id,
        name,
        character_type::text AS "characterType"
      FROM rpg_characters
      WHERE rpg_id = ${rpgId}
      ORDER BY created_at DESC
    `)
  },

  async findById(rpgId, itemId) {
    const rows = await prisma.$queryRaw<ItemRecord[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        name,
        image,
        description,
        pre_requirement AS "preRequirement",
        type,
        rarity,
        damage,
        "range" AS "range",
        ability,
        ability_name AS "abilityName",
        effect,
        effect_name AS "effectName",
        abilities,
        effects,
        custom_fields AS "customFields",
        weight,
        duration,
        durability,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM baseitems
      WHERE id = ${itemId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)

    return rows[0] ?? null
  },

  async create(rpgId, input) {
    const rows = await prisma.$queryRaw<ItemRecord[]>(Prisma.sql`
      INSERT INTO baseitems (
        id,
        rpg_id,
        name,
        image,
        description,
        pre_requirement,
        type,
        rarity,
        damage,
        "range",
        ability,
        ability_name,
        effect,
        effect_name,
        abilities,
        effects,
        custom_fields,
        weight,
        duration,
        durability
      )
      VALUES (
        ${crypto.randomUUID()},
        ${rpgId},
        ${input.name},
        ${input.image},
        ${input.description},
        ${input.preRequirement},
        ${input.type}::"public"."BaseItemType",
        ${input.rarity}::"public"."BaseItemRarity",
        ${input.damage},
        ${input.range},
        ${input.ability},
        ${input.abilityName},
        ${input.effect},
        ${input.effectName},
        ${JSON.stringify(input.abilities)}::jsonb,
        ${JSON.stringify(input.effects)}::jsonb,
        ${JSON.stringify(input.customFields)}::jsonb,
        ${input.weight ?? null},
        ${input.duration},
        ${input.durability ?? null}
      )
      RETURNING
        id,
        rpg_id AS "rpgId",
        name,
        image,
        description,
        pre_requirement AS "preRequirement",
        type,
        rarity,
        damage,
        "range" AS "range",
        ability,
        ability_name AS "abilityName",
        effect,
        effect_name AS "effectName",
        abilities,
        effects,
        custom_fields AS "customFields",
        weight,
        duration,
        durability,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)

    return rows[0]
  },

  async update(rpgId, itemId, input) {
    const rows = await prisma.$queryRaw<ItemRecord[]>(Prisma.sql`
      UPDATE baseitems
      SET
        name = ${input.name},
        image = ${input.image},
        description = ${input.description},
        pre_requirement = ${input.preRequirement},
        type = ${input.type}::"public"."BaseItemType",
        rarity = ${input.rarity}::"public"."BaseItemRarity",
        damage = ${input.damage},
        "range" = ${input.range},
        ability = ${input.ability},
        ability_name = ${input.abilityName},
        effect = ${input.effect},
        effect_name = ${input.effectName},
        abilities = ${JSON.stringify(input.abilities)}::jsonb,
        effects = ${JSON.stringify(input.effects)}::jsonb,
        custom_fields = ${JSON.stringify(input.customFields)}::jsonb,
        weight = ${input.weight ?? null},
        duration = ${input.duration},
        durability = ${input.durability ?? null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${itemId}
        AND rpg_id = ${rpgId}
      RETURNING
        id,
        rpg_id AS "rpgId",
        name,
        image,
        description,
        pre_requirement AS "preRequirement",
        type,
        rarity,
        damage,
        "range" AS "range",
        ability,
        ability_name AS "abilityName",
        effect,
        effect_name AS "effectName",
        abilities,
        effects,
        custom_fields AS "customFields",
        weight,
        duration,
        durability,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)

    return rows[0] ?? null
  },

  async delete(rpgId, itemId) {
    const rows = await prisma.$queryRaw<Array<{ id: string; image: string | null }>>(Prisma.sql`
      DELETE FROM baseitems
      WHERE id = ${itemId}
        AND rpg_id = ${rpgId}
      RETURNING id, image
    `)

    return rows[0] ?? null
  },

  async baseItemExists(rpgId, itemId) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM baseitems
      WHERE id = ${itemId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)

    return rows.length > 0
  },

  async listExistingCharacterIds(rpgId, characterIds) {
    if (characterIds.length === 0) {
      return []
    }

    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM rpg_characters
      WHERE rpg_id = ${rpgId}
        AND id IN (${Prisma.join(characterIds)})
    `)

    return rows.map((row) => row.id)
  },

  async giveToCharacters(input: GiveItemInput) {
    await prisma.$transaction(
      input.characterIds.map((characterId) =>
        prisma.$executeRaw(Prisma.sql`
          INSERT INTO rpg_character_inventory_items (
            id,
            rpg_id,
            character_id,
            base_item_id,
            quantity
          )
          VALUES (
            ${crypto.randomUUID()},
            ${input.rpgId},
            ${characterId},
            ${input.baseItemId},
            ${input.quantity}
          )
          ON CONFLICT (character_id, base_item_id)
          DO UPDATE SET
            quantity = rpg_character_inventory_items.quantity + EXCLUDED.quantity,
            updated_at = CURRENT_TIMESTAMP
        `),
      ),
    )
  },
}
