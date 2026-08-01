import type { EntityCatalogDetailAccessService } from "@/features/world/catalog/application/ports/EntityCatalogDetailAccessService"
import type { EntityCatalogDetailRepository } from "@/features/world/catalog/application/ports/EntityCatalogDetailRepository"
import type { EntityCatalogAbilityRepository } from "@/features/world/catalog/application/ports/EntityCatalogAbilityRepository"
import type { EntityCatalogPlayerRepository } from "@/features/world/catalog/application/ports/EntityCatalogPlayerRepository"
import type { EntityCatalogPurchaseRepository } from "@/features/world/catalog/application/ports/EntityCatalogPurchaseRepository"
import type { EntityCatalogDetailData } from "@/features/world/catalog/application/types"

type Deps = {
  repository: EntityCatalogDetailRepository
  abilityRepository: EntityCatalogAbilityRepository
  playerRepository: EntityCatalogPlayerRepository
  purchaseRepository: EntityCatalogPurchaseRepository
  accessService: EntityCatalogDetailAccessService
}

type Params =
  | {
      rpgId: string
      userId: string | null
      entityType: "class"
      classId: string
    }
  | {
      rpgId: string
      userId: string | null
      entityType: "race"
      raceKey: string
    }

export async function loadEntityCatalogDetailUseCase(
  deps: Deps,
  params: Params,
): Promise<EntityCatalogDetailData | null> {
  const snapshot =
    params.entityType === "class"
      ? await deps.repository.getClassDetail({
          rpgId: params.rpgId,
          classId: params.classId,
        })
      : await deps.repository.getRaceDetail({
          rpgId: params.rpgId,
          raceKey: params.raceKey,
        })

  if (!snapshot) {
    return null
  }

  const isOwner = Boolean(params.userId && params.userId === snapshot.ownerId)
  let canManage = false
  let isAcceptedMember = false

  if (params.userId) {
    const access = await deps.accessService.getAccess(
      params.rpgId,
      params.userId,
    )
    canManage = access.canManage
    isAcceptedMember = !isOwner && access.isAcceptedMember
  }

  if (!(snapshot.visibility === "public" || isOwner || isAcceptedMember)) {
    return null
  }

  const [
    attributeTemplates,
    skillTemplates,
    abilities,
    players,
    abilityPurchase,
  ] = await Promise.all([
    deps.repository.listAttributeTemplates(params.rpgId),
    deps.repository.listSkillTemplates(params.rpgId),
    snapshot.entityType === "class"
      ? deps.abilityRepository.listClassAbilities(snapshot.id)
      : deps.abilityRepository.listRaceAbilities(snapshot.id),
    snapshot.entityType === "class"
      ? deps.playerRepository.listClassPlayers({
          rpgId: params.rpgId,
          classKey: snapshot.key,
          classId: snapshot.id,
          userId: params.userId,
          isOwner,
        })
      : deps.playerRepository.listRacePlayers({
          rpgId: params.rpgId,
          raceKey: snapshot.key,
          userId: params.userId,
          isOwner,
        }),
    params.userId
      ? snapshot.entityType === "class"
        ? deps.purchaseRepository.getClassPurchaseState({
            rpgId: params.rpgId,
            userId: params.userId,
            classKey: snapshot.key,
            costsEnabled: snapshot.costsEnabled,
            costResourceName: snapshot.costResourceName,
          })
        : deps.purchaseRepository.getRacePurchaseState({
            rpgId: params.rpgId,
            userId: params.userId,
            raceKey: snapshot.key,
          })
      : Promise.resolve({
          characterId: null,
          costsEnabled:
            snapshot.entityType === "class" ? snapshot.costsEnabled : false,
          costResourceName:
            snapshot.entityType === "class"
              ? snapshot.costResourceName
              : "Skill Points",
          initialPoints: 0,
          initialOwnedBySkill: {},
        }),
  ])

  return {
    canManage,
    current: snapshot.current,
    attributeTemplates,
    skillTemplates,
    abilities,
    players,
    abilityPurchase,
  }
}
