import type {
  CharacterInventoryRepository,
  CharacterInventoryMembershipRow,
  CharacterInventoryRpgRow,
  CharacterInventoryCharacterRow,
  CharacterWeightContextRow,
  CharacterInventoryStoredItemRow,
} from "@/application/characterInventory/ports/CharacterInventoryRepository"
import type { CharacterInventoryItemDto } from "@/application/characterInventory/types"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../generated/prisma/client.js"

export const prismaCharacterInventoryRepository: CharacterInventoryRepository = {
  async getRpg(rpgId: string): Promise<CharacterInventoryRpgRow | null> {
    const rpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true },
    })

    return rpg ?? null
  },

  async getMembership(
    rpgId: string,
    userId: string,
  ): Promise<CharacterInventoryMembershipRow | null> {
    const rows = await prisma.$queryRaw<CharacterInventoryMembershipRow[]>(Prisma.sql`
      SELECT status::text AS status, role::text AS role
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)

    return rows[0] ?? null
  },

  async getCharacter(
    rpgId: string,
    characterId: string,
  ): Promise<CharacterInventoryCharacterRow | null> {
    const rows = await prisma.$queryRaw<CharacterInventoryCharacterRow[]>(Prisma.sql`
      SELECT
        id,
        name,
        character_type AS "characterType",
        created_by_user_id AS "createdByUserId"
      FROM rpg_characters
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)

    return rows[0] ?? null
  },

  async getWeightContext(
    rpgId: string,
    characterId: string,
  ): Promise<CharacterWeightContextRow> {
    try {
      const rows = await prisma.$queryRaw<CharacterWeightContextRow[]>(Prisma.sql`
        SELECT
          COALESCE(r.use_inventory_weight_limit, false) AS "useInventoryWeightLimit",
          c.max_carry_weight AS "maxCarryWeight"
        FROM rpgs r
        INNER JOIN rpg_characters c ON c.rpg_id = r.id
        WHERE r.id = ${rpgId}
          AND c.id = ${characterId}
        LIMIT 1
      `)

      return rows[0] ?? { useInventoryWeightLimit: false, maxCarryWeight: null }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "use_inventory_weight_limit" does not exist') ||
          error.message.includes('column "max_carry_weight" does not exist'))
      ) {
        return { useInventoryWeightLimit: false, maxCarryWeight: null }
      }
      throw error
    }
  },

  listInventory(rpgId: string, characterId: string): Promise<CharacterInventoryItemDto[]> {
    return prisma.$queryRaw<CharacterInventoryItemDto[]>(Prisma.sql`
      SELECT
        i.id,
        i.rpg_id AS "rpgId",
        i.character_id AS "characterId",
        i.base_item_id AS "baseItemId",
        i.quantity,
        b.name AS "itemName",
        b.image AS "itemImage",
        b.description AS "itemDescription",
        b.pre_requirement AS "itemPreRequirement",
        b.type AS "itemType",
        b.rarity AS "itemRarity",
        b.damage AS "itemDamage",
        b."range" AS "itemRange",
        b.ability AS "itemAbility",
        b.ability_name AS "itemAbilityName",
        b.effect AS "itemEffect",
        b.effect_name AS "itemEffectName",
        b.abilities AS "itemAbilities",
        b.effects AS "itemEffects",
        b.custom_fields AS "itemCustomFields",
        b.weight AS "itemWeight",
        b.duration AS "itemDuration",
        b.durability AS "itemDurability"
      FROM rpg_character_inventory_items i
      INNER JOIN baseitems b ON b.id = i.base_item_id
      WHERE i.rpg_id = ${rpgId}
        AND i.character_id = ${characterId}
      ORDER BY i.created_at DESC
    `)
  },

  async getInventoryItem(
    rpgId: string,
    characterId: string,
    inventoryItemId: string,
  ): Promise<CharacterInventoryStoredItemRow | null> {
    const rows = await prisma.$queryRaw<CharacterInventoryStoredItemRow[]>(Prisma.sql`
      SELECT id, quantity
      FROM rpg_character_inventory_items
      WHERE id = ${inventoryItemId}
        AND rpg_id = ${rpgId}
        AND character_id = ${characterId}
      LIMIT 1
    `)

    return rows[0] ?? null
  },

  async deleteInventoryItem(rpgId: string, characterId: string, inventoryItemId: string) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_character_inventory_items
      WHERE id = ${inventoryItemId}
        AND rpg_id = ${rpgId}
        AND character_id = ${characterId}
    `)
  },

  async updateInventoryItemQuantity(
    rpgId: string,
    characterId: string,
    inventoryItemId: string,
    quantity: number,
  ) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE rpg_character_inventory_items
      SET
        quantity = ${quantity},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${inventoryItemId}
        AND rpg_id = ${rpgId}
        AND character_id = ${characterId}
    `)
  },
}
