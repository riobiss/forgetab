import { Prisma } from "../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"

type PermissionRow = {
  ownerId: string
  memberStatus: "pending" | "accepted" | "rejected" | null
  memberRole: "member" | "moderator" | null
}

export type RpgPermission = {
  exists: boolean
  ownerId: string | null
  isOwner: boolean
  isAcceptedMember: boolean
  isModerator: boolean
  canManage: boolean
}

export async function getRpgPermission(rpgId: string, userId: string): Promise<RpgPermission> {
  const rows = await prisma.$queryRaw<PermissionRow[]>(Prisma.sql`
    SELECT
      r.owner_id AS "ownerId",
      m.status::text AS "memberStatus",
      m.role::text AS "memberRole"
    FROM rpgs r
    LEFT JOIN rpg_members m
      ON m.rpg_id = r.id
      AND m.user_id = ${userId}
    WHERE r.id = ${rpgId}
    LIMIT 1
  `)

  const row = rows[0]
  if (!row) {
    return {
      exists: false,
      ownerId: null,
      isOwner: false,
      isAcceptedMember: false,
      isModerator: false,
      canManage: false,
    }
  }

  const isOwner = row.ownerId === userId
  const isAcceptedMember = row.memberStatus === "accepted"
  const isModerator = isAcceptedMember && row.memberRole === "moderator"

  return {
    exists: true,
    ownerId: row.ownerId,
    isOwner,
    isAcceptedMember,
    isModerator,
    canManage: isOwner || isModerator,
  }
}
