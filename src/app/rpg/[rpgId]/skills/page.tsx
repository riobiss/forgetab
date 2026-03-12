import { notFound } from "next/navigation"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { loadSkillsPageUseCase } from "@/application/skillsPage/use-cases/loadSkillsPage"
import { prismaSkillsPageRepository } from "@/infrastructure/skillsPage/repositories/prismaSkillsPageRepository"
import { skillsPageAccessService } from "@/infrastructure/skillsPage/services/skillsPageAccessService"
import SkillsDashboardFeature from "@/presentation/skills-dashboard/SkillsDashboardFeature"

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

  const data = await loadSkillsPageUseCase(
    prismaSkillsPageRepository,
    skillsPageAccessService,
    { rpgId, userId },
  )

  if (!data) {
    notFound()
  }

  return (
    <SkillsDashboardFeature
      ownedRpgs={[{ id: data.rpg.id, title: data.rpg.title }]}
      initialRpgId={data.rpg.id}
      gatewayFactory="http"
      hideRpgSelector
      title={`Habilidades - ${data.rpg.title}`}
    />
  )
}
