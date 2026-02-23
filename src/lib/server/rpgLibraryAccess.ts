import { NextRequest } from "next/server"
import { Prisma } from "../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

type AccessRow = {
  ownerId: string
}

type MemberStatusRow = {
  status: "pending" | "accepted" | "rejected"
}

export async function getUserIdFromRequestToken(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
  if (!token) {
    return null
  }

  try {
    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
}

export async function getRpgVisibilityAccess(rpgId: string, userId: string) {
  const rows = await prisma.$queryRaw<AccessRow[]>(Prisma.sql`
    SELECT owner_id AS "ownerId"
    FROM rpgs
    WHERE id = ${rpgId}
    LIMIT 1
  `)

  const rpg = rows[0]
  if (!rpg) {
    return { exists: false as const, canView: false as const, canManage: false as const }
  }

  const isOwner = rpg.ownerId === userId
  if (isOwner) {
    return { exists: true as const, canView: true as const, canManage: true as const }
  }

  const memberRows = await prisma.$queryRaw<MemberStatusRow[]>(Prisma.sql`
    SELECT status
    FROM rpg_members
    WHERE rpg_id = ${rpgId}
      AND user_id = ${userId}
    LIMIT 1
  `)

  const isAcceptedMember = memberRows[0]?.status === "accepted"
  return {
    exists: true as const,
    canView: isAcceptedMember,
    canManage: false as const,
  }
}
