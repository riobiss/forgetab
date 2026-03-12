import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { ensureItemsLayoutAccessUseCase } from "@/application/itemsLayout/use-cases/ensureItemsLayoutAccess"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { cookieItemsLayoutSessionService } from "@/infrastructure/itemsLayout/services/cookieItemsLayoutSessionService"

type Props = {
  children: ReactNode
  params: Promise<{
    rpgId: string
  }>
}

export default async function ItemsLayout({ children, params }: Props) {
  const { rpgId } = await params
  const access = await ensureItemsLayoutAccessUseCase(
    {
      sessionService: cookieItemsLayoutSessionService,
      permissionService: rpgPermissionService,
    },
    { rpgId },
  )

  if (!access.allowed) {
    notFound()
  }

  return <>{children}</>
}
