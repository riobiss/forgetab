import { Prisma } from "../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"

export type MemberStatus = "pending" | "accepted" | "rejected"

type MemberStatusRow = {
  status: MemberStatus
}

export async function getMembershipStatus(
  rpgId: string,
  userId: string,
): Promise<MemberStatus | null> {
  const membership = await prisma.$queryRaw<MemberStatusRow[]>(Prisma.sql`
    SELECT status
    FROM rpg_members
    WHERE rpg_id = ${rpgId}
      AND user_id = ${userId}
    LIMIT 1
  `)

  return membership[0]?.status ?? null
}

export async function isAcceptedMember(
  rpgId: string,
  userId: string,
): Promise<boolean> {
  const status = await getMembershipStatus(rpgId, userId)
  return status === "accepted"
}
