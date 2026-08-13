import type { OfflineCampaignRepository } from "@/features/offline/application/ports/OfflineCampaignRepository"
import { prisma } from "@/features/shared/infrastructure/database/prisma"
import { Prisma } from "../../../../../generated/prisma/client"

type CampaignRow = {
  id: string
  title: string
  description: string
  image: string | null
}

type CharacterRow = {
  id: string
  rpgId: string
}

export const prismaOfflineCampaignRepository: OfflineCampaignRepository = {
  async listAvailableForUser(userId) {
    const campaigns = await prisma.$queryRaw<CampaignRow[]>(Prisma.sql`
      SELECT DISTINCT r.id, r.title, r.description, r.image
      FROM rpgs r
      LEFT JOIN rpg_members m
        ON m.rpg_id = r.id
       AND m.user_id = ${userId}
       AND m.status = 'accepted'::"RpgMemberStatus"
      WHERE r.owner_id = ${userId} OR m.id IS NOT NULL
      ORDER BY r.title ASC
    `)

    if (!campaigns.length) return []

    const characters = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      SELECT id, rpg_id AS "rpgId"
      FROM rpg_characters
      WHERE rpg_id IN (${Prisma.join(campaigns.map((item) => item.id))})
        AND created_by_user_id = ${userId}
        AND character_type = 'player'::"RpgCharacterType"
      ORDER BY updated_at DESC
    `)

    return campaigns.map((campaign) => ({
      ...campaign,
      characters: characters
        .filter((character) => character.rpgId === campaign.id)
        .map(({ id }) => ({ id }))
    }))
  }
}
