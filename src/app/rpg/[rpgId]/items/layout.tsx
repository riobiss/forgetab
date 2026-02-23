import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

type Props = {
  children: ReactNode
  params: Promise<{
    rpgId: string
  }>
}

export default async function ItemsLayout({ children, params }: Props) {
  const { rpgId } = await params
  const userId = await getUserIdFromCookieStore()

  if (!userId) {
    notFound()
  }

  const permission = await getRpgPermission(rpgId, userId)
  if (!permission.canManage) {
    notFound()
  }

  return <>{children}</>
}
