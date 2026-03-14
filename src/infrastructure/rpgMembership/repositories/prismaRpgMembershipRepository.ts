import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { RpgMembershipRepository } from "@/application/rpgMembership/ports/RpgMembershipRepository"
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
        u.name
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
      ORDER BY u.name ASC
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
        u.name AS "userName",
        r.requested_at AS "requestedAt"
      FROM rpg_character_creation_requests r
      INNER JOIN users u ON u.id = r.user_id
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
}
