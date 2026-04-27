import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import {
  fetchRpgPageAccess,
  HttpPageAccessError,
} from "@/infrastructure/rpgManagement/repositories/httpRpgPageAccessRepository"

type Props = {
  children: ReactNode
  params: Promise<{
    rpgId: string
  }>
}

export default async function ItemsLayout({ children, params }: Props) {
  const { rpgId } = await params
  let access

  try {
    access = await fetchRpgPageAccess(rpgId)
  } catch (error) {
    if (
      error instanceof HttpPageAccessError &&
      (error.status === 401 || error.status === 403 || error.status === 404)
    ) {
      notFound()
    }

    throw error
  }

  if (!access.canManage) {
    notFound()
  }

  return <>{children}</>
}
