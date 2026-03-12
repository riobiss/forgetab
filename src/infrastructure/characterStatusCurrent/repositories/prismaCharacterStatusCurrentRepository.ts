import type { CharacterStatusCurrentRepository } from "@/application/characterStatusCurrent/ports/CharacterStatusCurrentRepository"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../generated/prisma/client.js"

export const prismaCharacterStatusCurrentRepository: CharacterStatusCurrentRepository = {
  async getRpg(rpgId) {
    const rpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true },
    })

    return rpg ?? null
  },

  async getMembership(rpgId, userId) {
    const rows = await prisma.$queryRaw<Array<{ status: string; role: string }>>(Prisma.sql`
      SELECT status::text AS status, role::text AS role
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)

    return rows[0] ?? null
  },

  async getCharacter(rpgId, characterId) {
    const rows = await prisma.$queryRaw<Array<{
      id: string
      createdByUserId: string | null
      statuses: Prisma.JsonValue
      currentStatuses: Prisma.JsonValue
    }>>(Prisma.sql`
      SELECT
        id,
        created_by_user_id AS "createdByUserId",
        statuses,
        COALESCE(current_statuses, '{}'::jsonb) AS "currentStatuses"
      FROM rpg_characters
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)

    return rows[0] ?? null
  },

  async updateCharacterStatus(rpgId, characterId, input) {
    const data: {
      currentStatuses: Prisma.JsonObject
      updatedAt: Date
      life?: number
      mana?: number
      sanity?: number
      stamina?: number
    } = {
      currentStatuses: input.currentStatuses,
      updatedAt: new Date(),
    }

    if (input.coreColumn === "life") data.life = input.nextValue
    if (input.coreColumn === "mana") data.mana = input.nextValue
    if (input.coreColumn === "sanity") data.sanity = input.nextValue
    if (input.coreColumn === "stamina") data.stamina = input.nextValue

    const updated = await prisma.rpgCharacter.updateMany({
      where: { id: characterId, rpgId },
      data,
    })

    return updated.count > 0
  },
}
