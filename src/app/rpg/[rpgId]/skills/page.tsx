import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getRpgPermission } from "@/lib/server/rpgPermissions"
import SkillsDashboardClient from "./components/SkillsDashboardClient"

type PageProps = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function RpgSkillsBuilderPage({ params }: PageProps) {
  const { rpgId } = await params
  const userId = await getUserIdFromCookieStore()

  if (!userId) {
    notFound()
  }

  const rpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, title: true, ownerId: true },
  })

  if (!rpg) {
    notFound()
  }

  const permission = await getRpgPermission(rpgId, userId)
  if (!permission.canManage) {
    notFound()
  }

  return (
    <SkillsDashboardClient
      ownedRpgs={[{ id: rpg.id, title: rpg.title }]}
      initialRpgId={rpg.id}
      hideRpgSelector
      title={`Habilidades - ${rpg.title}`}
    />
  )
}
