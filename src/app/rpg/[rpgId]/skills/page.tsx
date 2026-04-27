import { notFound } from "next/navigation"
import {
  fetchRpgPageAccess,
  HttpPageAccessError,
} from "@/infrastructure/rpgManagement/repositories/httpRpgPageAccessRepository"
import SkillsDashboardFeature from "@/presentation/skills-dashboard/SkillsDashboardFeature"

type PageProps = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function RpgSkillsBuilderPage({ params }: PageProps) {
  const { rpgId } = await params
  let rpg

  try {
    rpg = await fetchRpgPageAccess(rpgId)
  } catch (error) {
    if (
      error instanceof HttpPageAccessError &&
      (error.status === 401 || error.status === 403 || error.status === 404)
    ) {
      notFound()
    }

    throw error
  }

  if (!rpg.canManage) {
    notFound()
  }

  return (
    <SkillsDashboardFeature
      ownedRpgs={[{ id: rpg.id, title: rpg.title }]}
      initialRpgId={rpg.id}
      gatewayFactory="http"
      hideRpgSelector
      title={`Habilidades - ${rpg.title}`}
    />
  )
}
