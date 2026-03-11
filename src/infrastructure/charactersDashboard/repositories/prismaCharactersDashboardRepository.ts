import type { CharactersDashboardRepository } from "@/application/charactersDashboard/ports/CharactersDashboardRepository"
import type {
  CharacterDashboardCardDto,
  CharactersDashboardRpgDto,
} from "@/application/charactersDashboard/types"
import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../generated/prisma"

type DbRpgRow = CharactersDashboardRpgDto
type DbCharacterRow = CharacterDashboardCardDto

export const prismaCharactersDashboardRepository: CharactersDashboardRepository = {
  async getRpg(rpgId: string): Promise<CharactersDashboardRpgDto | null> {
    let rpgRows: DbRpgRow[] = []

    try {
      rpgRows = await prisma.$queryRaw<DbRpgRow[]>(Prisma.sql`
        SELECT
          id,
          owner_id AS "ownerId",
          visibility,
          COALESCE(allow_multiple_player_characters, false) AS "allowMultiplePlayerCharacters"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('column "allow_multiple_player_characters" does not exist')
      ) {
        rpgRows = await prisma.$queryRaw<DbRpgRow[]>(Prisma.sql`
          SELECT
            id,
            owner_id AS "ownerId",
            visibility,
            false AS "allowMultiplePlayerCharacters"
          FROM rpgs
          WHERE id = ${rpgId}
          LIMIT 1
        `)
      } else {
        throw error
      }
    }

    return rpgRows[0] ?? null
  },

  async listCharacters({
    rpgId,
    filterType,
    viewerUserId,
    isOwner,
  }): Promise<CharacterDashboardCardDto[]> {
    return prisma.$queryRaw<DbCharacterRow[]>(Prisma.sql`
      SELECT
        id,
        name,
        image,
        character_type AS "characterType",
        created_by_user_id AS "createdByUserId"
      FROM rpg_characters
      WHERE rpg_id = ${rpgId}
        ${
          isOwner
            ? Prisma.empty
            : viewerUserId
              ? Prisma.sql`AND (visibility = 'public'::"RpgVisibility" OR created_by_user_id = ${viewerUserId})`
              : Prisma.sql`AND visibility = 'public'::"RpgVisibility"`
        }
        ${
          filterType !== "all"
            ? Prisma.sql`AND character_type = ${filterType}::"RpgCharacterType"`
            : Prisma.empty
        }
      ORDER BY created_at DESC
    `)
  },

  async countOwnPlayerCharacters(rpgId: string, userId: string): Promise<number> {
    const rows = await prisma.$queryRaw<Array<{ count: bigint | number }>>(Prisma.sql`
      SELECT COUNT(*) AS count
      FROM rpg_characters
      WHERE rpg_id = ${rpgId}
        AND character_type = 'player'::"RpgCharacterType"
        AND created_by_user_id = ${userId}
    `)

    const rawCount = rows[0]?.count ?? 0
    return typeof rawCount === "bigint" ? Number(rawCount) : rawCount
  },
}
