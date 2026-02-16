import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import SkillsDashboardClient from "@/app/dashboard/skills/SkillsDashboardClient"

type PageProps = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function CharacterSkillsBuilderPage({ params }: PageProps) {
  const { rpgId } = await params
  const userId = await getUserIdFromCookieStore()

  if (!userId) {
    notFound()
  }

  const rpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, title: true, ownerId: true },
  })

  if (!rpg || rpg.ownerId !== userId) {
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
