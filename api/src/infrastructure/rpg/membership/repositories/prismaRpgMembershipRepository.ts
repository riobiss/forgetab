import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { RpgMembershipRepository } from "@/application/rpg/membership/ports/RpgMembershipRepository"
import { normalizeRpgVisibility } from "@/infrastructure/shared/normalizeRpgVisibility"

export const prismaRpgMembershipRepository: RpgMembershipRepository = {
  async getRpgSummary(rpgId) {
    const rpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true, visibility: true },
    })
    if (rpg !== undefined) {
      return rpg
        ? { id: rpg.id, ownerId: rpg.ownerId, visibility: normalizeRpgVisibility(rpg.visibility) }
        : null
    }

    const rows = await prisma.$queryRaw<Array<{ id: string; ownerId: string; visibility: "private" | "public" }>>(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        visibility
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)
    const row = rows[0]
    return row
      ? { ...row, visibility: normalizeRpgVisibility(row.visibility) }
      : null
  },

  async getMembership(rpgId, userId) {
    const rows = await prisma.$queryRaw<Array<{ id: string; status: "pending" | "accepted" | "rejected" }>>(Prisma.sql`
      SELECT id, status
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)
    return rows[0] ?? null
  },

  listAllowedUsers(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT DISTINCT
        u.id,
        u.username,
        COALESCE(NULLIF(p.display_name, ''), u.name) AS name
      FROM users u
      INNER JOIN (
        SELECT owner_id AS user_id
        FROM rpgs
        WHERE id = ${rpgId}
        UNION
        SELECT user_id
        FROM rpg_members
        WHERE rpg_id = ${rpgId}
          AND status = 'accepted'::"public"."RpgMemberStatus"
      ) allowed_users ON allowed_users.user_id = u.id
      LEFT JOIN rpg_user_profiles p ON p.rpg_id = ${rpgId} AND p.user_id = u.id
      ORDER BY COALESCE(NULLIF(p.display_name, ''), u.name) ASC
    `)
  },

  async createPendingMembership(rpgId, userId) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_members (id, rpg_id, user_id, status)
      VALUES (${crypto.randomUUID()}, ${rpgId}, ${userId}, 'pending'::"public"."RpgMemberStatus")
    `)
  },

  async resendMembershipRequest(membershipId) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE rpg_members
      SET
        status = 'pending'::"public"."RpgMemberStatus",
        requested_at = CURRENT_TIMESTAMP,
        responded_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${membershipId}
    `)
  },

  async toggleModerator(rpgId, memberId, ownerId) {
    const rows = await prisma.$queryRaw<Array<{ role: string }>>(Prisma.sql`
      UPDATE rpg_members
      SET
        role = CASE
          WHEN role = 'moderator'::"public"."RpgMemberRole" THEN 'member'::"public"."RpgMemberRole"
          ELSE 'moderator'::"public"."RpgMemberRole"
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${memberId}
        AND rpg_id = ${rpgId}
        AND status = 'accepted'::"public"."RpgMemberStatus"
        AND user_id <> ${ownerId}
      RETURNING role::text AS role
    `)
    return rows[0] ?? null
  },

  async processMembershipRequest(rpgId, memberId, nextStatus) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE rpg_members
      SET
        status = ${nextStatus}::"public"."RpgMemberStatus",
        responded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${memberId}
        AND rpg_id = ${rpgId}
        AND status = 'pending'::"public"."RpgMemberStatus"
      RETURNING id
    `)
    return rows.length > 0
  },

  async expelMember(rpgId, memberId, ownerId) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM rpg_members
      WHERE id = ${memberId}
        AND rpg_id = ${rpgId}
        AND status = 'accepted'::"public"."RpgMemberStatus"
        AND user_id <> ${ownerId}
      RETURNING id
    `)
    return rows.length > 0
  },

  listPendingCharacterRequests(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT
        r.id,
        r.user_id AS "userId",
        u.username AS "userUsername",
        COALESCE(NULLIF(p.display_name, ''), u.name) AS "userName",
        r.requested_at AS "requestedAt"
      FROM rpg_character_creation_requests r
      INNER JOIN users u ON u.id = r.user_id
      LEFT JOIN rpg_user_profiles p ON p.rpg_id = r.rpg_id AND p.user_id = u.id
      WHERE r.rpg_id = ${rpgId}
        AND r.status = 'pending'::"public"."CharacterCreationRequestStatus"
      ORDER BY r.requested_at DESC
    `)
  },

  async getCharacterRequest(rpgId, userId) {
    const rows = await prisma.$queryRaw<Array<{ id: string; status: "pending" | "accepted" | "rejected" }>>(Prisma.sql`
      SELECT id, status
      FROM rpg_character_creation_requests
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)
    return rows[0] ?? null
  },

  async createPendingCharacterRequest(rpgId, userId) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_character_creation_requests (id, rpg_id, user_id, status)
      VALUES (
        ${crypto.randomUUID()},
        ${rpgId},
        ${userId},
        'pending'::"public"."CharacterCreationRequestStatus"
      )
    `)
  },

  async resendCharacterRequest(requestId) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE rpg_character_creation_requests
      SET
        status = 'pending'::"public"."CharacterCreationRequestStatus",
        requested_at = CURRENT_TIMESTAMP,
        responded_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId}
    `)
  },

  async processCharacterRequest(rpgId, requestId, nextStatus) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE rpg_character_creation_requests
      SET
        status = ${nextStatus}::"public"."CharacterCreationRequestStatus",
        responded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId}
        AND rpg_id = ${rpgId}
        AND status = 'pending'::"public"."CharacterCreationRequestStatus"
      RETURNING id
    `)
    return rows.length > 0
  },

  async getPendingCharacterOffer(rpgId, offerId, userId) {
    const offerRows = await prisma.$queryRaw<
      Array<{
        id: string
        characterId: string
        allowMultiplePlayerCharacters: boolean
        existingPlayers: number
      }>
    >(Prisma.sql`
      SELECT
        o.id,
        o.character_id AS "characterId",
        COALESCE(r.allow_multiple_player_characters, false) AS "allowMultiplePlayerCharacters",
        (
          SELECT COUNT(*)::int
          FROM rpg_characters existing
          WHERE existing.rpg_id = o.rpg_id
            AND existing.created_by_user_id = o.user_id
            AND existing.character_type = 'player'::"public"."RpgCharacterType"
        ) AS "existingPlayers"
      FROM rpg_character_offers o
      INNER JOIN rpgs r ON r.id = o.rpg_id
      INNER JOIN rpg_characters c ON c.id = o.character_id
      WHERE o.id = ${offerId}
        AND o.rpg_id = ${rpgId}
        AND o.user_id = ${userId}
        AND o.status = 'pending'::"public"."CharacterCreationRequestStatus"
        AND c.character_type = 'player'::"public"."RpgCharacterType"
      LIMIT 1
    `)
    return offerRows[0] ?? null
  },

  async processCharacterOffer(rpgId, offerId, userId, nextStatus) {
    const rows = await prisma.$transaction(async (tx) => {
      const offerRows = await tx.$queryRaw<Array<{ id: string; characterId: string }>>(Prisma.sql`
        SELECT
          o.id,
          o.character_id AS "characterId"
        FROM rpg_character_offers o
        INNER JOIN rpg_characters c ON c.id = o.character_id
        WHERE o.id = ${offerId}
          AND o.rpg_id = ${rpgId}
          AND o.user_id = ${userId}
          AND o.status = 'pending'::"public"."CharacterCreationRequestStatus"
          AND c.character_type = 'player'::"public"."RpgCharacterType"
        LIMIT 1
      `)
      const offer = offerRows[0]
      if (!offer) return []

      const updatedOffers = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE rpg_character_offers
        SET
          status = ${nextStatus}::"public"."CharacterCreationRequestStatus",
          responded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${offerId}
          AND rpg_id = ${rpgId}
          AND user_id = ${userId}
          AND status = 'pending'::"public"."CharacterCreationRequestStatus"
        RETURNING id
      `)

      if (nextStatus === "accepted" && updatedOffers.length > 0) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE rpg_characters
          SET
            created_by_user_id = ${userId},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${offer.characterId}
            AND rpg_id = ${rpgId}
            AND character_type = 'player'::"public"."RpgCharacterType"
        `)
        await tx.$executeRaw(Prisma.sql`
          UPDATE rpg_character_offers
          SET
            status = 'rejected'::"public"."CharacterCreationRequestStatus",
            responded_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE rpg_id = ${rpgId}
            AND character_id = ${offer.characterId}
            AND id <> ${offerId}
            AND status = 'pending'::"public"."CharacterCreationRequestStatus"
        `)
      }

      return updatedOffers
    })

    return rows.length > 0
  },
}
