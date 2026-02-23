import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"

type Props = {
  children: ReactNode
  params: Promise<{
    rpgId: string
  }>
}

type OwnerRow = {
  ownerId: string
}

export default async function ItemsLayout({ children, params }: Props) {
  const { rpgId } = await params
  const userId = await getUserIdFromCookieStore()

  if (!userId) {
    notFound()
  }

  const rows = await prisma.$queryRaw<OwnerRow[]>(Prisma.sql`
    SELECT owner_id AS "ownerId"
    FROM rpgs
    WHERE id = ${rpgId}
    LIMIT 1
  `)

  const ownerId = rows[0]?.ownerId
  if (!ownerId || ownerId !== userId) {
    notFound()
  }

  return <>{children}</>
}
