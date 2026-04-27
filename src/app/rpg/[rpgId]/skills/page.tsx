import { notFound } from "next/navigation"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
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
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()

  if (!userId) {
    notFound()
  }

  const pageData = await loadSkillsPageUseCase(
    prismaSkillsPageRepository,
    skillsPageAccessService,
    { rpgId, userId },
  )

  if (!pageData) {
    notFound()
  }

  return (
    <SkillsDashboardFeature
      ownedRpgs={[{ id: pageData.rpg.id, title: pageData.rpg.title }]}
      initialRpgId={pageData.rpg.id}
      gatewayFactory="http"
      hideRpgSelector
      title={`Habilidades - ${pageData.rpg.title}`}
    />
  )
}
