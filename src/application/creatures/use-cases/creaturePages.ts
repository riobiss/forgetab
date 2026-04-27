import type { CreaturesDependencies } from "@/application/creatures/contracts/CreaturesDependencies"

type Dependencies = CreaturesDependencies

async function loadManageSnapshot(deps: Dependencies, rpgId: string) {
  const dashboard = await deps.gateway.fetchDashboard(rpgId)
  return dashboard.canManageNpcCreature ? dashboard : null
}

export async function loadCreaturesDashboardPageUseCase(
  deps: Dependencies,
  params: { rpgId: string },
) {
  return deps.gateway.fetchDashboard(params.rpgId)
}

export async function loadNewCreaturePageUseCase(
  deps: Dependencies,
  params: { rpgId: string },
) {
  const [dashboard, bootstrap, categories] = await Promise.all([
    deps.gateway.fetchDashboard(params.rpgId),
    deps.gateway.fetchBootstrap(params.rpgId),
    deps.gateway.fetchTemplates(params.rpgId),
  ])

  if (!dashboard.canManageNpcCreature) {
    return null
  }

  return { bootstrap, categories }
}

export async function loadEditCreaturePageUseCase(
  deps: Dependencies,
  params: { rpgId: string; creatureId: string },
) {
  const [dashboard, bootstrap, categories, creature] = await Promise.all([
    deps.gateway.fetchDashboard(params.rpgId),
    deps.gateway.fetchBootstrap(params.rpgId),
    deps.gateway.fetchTemplates(params.rpgId),
    deps.gateway.fetchCreature(params.rpgId, params.creatureId),
  ])

  if (!dashboard.canManageNpcCreature) {
    return null
  }

  return { bootstrap, categories, creature }
}

export async function loadCreatureConfigPageUseCase(
  deps: Dependencies,
  params: { rpgId: string },
) {
  const [dashboard, categories] = await Promise.all([
    deps.gateway.fetchDashboard(params.rpgId),
    deps.gateway.fetchTemplates(params.rpgId),
  ])

  if (!dashboard.canManageNpcCreature) {
    return null
  }

  return { categories }
}

export async function loadCreatureDetailPageUseCase(
  deps: Dependencies,
  params: { rpgId: string; creatureId: string },
) {
  const [dashboard, creature, categories] = await Promise.all([
    deps.gateway.fetchDashboard(params.rpgId),
    deps.gateway.fetchCreature(params.rpgId, params.creatureId),
    deps.gateway.fetchTemplates(params.rpgId),
  ])

  if (!dashboard.canManageNpcCreature) {
    return null
  }

  return { creature, categories }
}
