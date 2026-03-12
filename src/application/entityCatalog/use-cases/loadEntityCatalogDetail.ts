import type { EntityCatalogDetailAccessService } from "@/application/entityCatalog/ports/EntityCatalogDetailAccessService"
import type { EntityCatalogDetailRepository } from "@/application/entityCatalog/ports/EntityCatalogDetailRepository"
import type { EntityCatalogDetailData } from "@/application/entityCatalog/types"

type Deps = {
  repository: EntityCatalogDetailRepository
  accessService: EntityCatalogDetailAccessService
}

type Params =
  | { rpgId: string; userId: string | null; entityType: "class"; classId: string }
  | { rpgId: string; userId: string | null; entityType: "race"; raceKey: string }

export async function loadEntityCatalogDetailUseCase(
  deps: Deps,
  params: Params,
): Promise<EntityCatalogDetailData | null> {
  const snapshot =
    params.entityType === "class"
      ? await deps.repository.getClassDetail({ rpgId: params.rpgId, classId: params.classId })
      : await deps.repository.getRaceDetail({ rpgId: params.rpgId, raceKey: params.raceKey })

  if (!snapshot) {
    return null
  }

  const isOwner = Boolean(params.userId && params.userId === snapshot.ownerId)
  let canManage = false
  let isAcceptedMember = false

  if (params.userId) {
    const permission = await deps.accessService.getRpgPermission(params.rpgId, params.userId)
    canManage = permission.canManage
    if (!isOwner) {
      isAcceptedMember =
        permission.isAcceptedMember ||
        (await deps.accessService.getMembershipStatus(params.rpgId, params.userId)) === "accepted"
    }
  }

  if (!(snapshot.visibility === "public" || isOwner || isAcceptedMember)) {
    return null
  }

  const [attributeTemplates, skillTemplates, abilities, players, abilityPurchase] = await Promise.all([
    deps.repository.listAttributeTemplates(params.rpgId),
    deps.repository.listSkillTemplates(params.rpgId),
    snapshot.entityType === "class"
      ? deps.repository.listClassAbilities(snapshot.id)
      : deps.repository.listRaceAbilities(snapshot.id),
    snapshot.entityType === "class"
      ? deps.repository.listClassPlayers({
          rpgId: params.rpgId,
          classKey: snapshot.key,
          classId: snapshot.id,
          userId: params.userId,
          isOwner,
        })
      : deps.repository.listRacePlayers({
          rpgId: params.rpgId,
          raceKey: snapshot.key,
          userId: params.userId,
          isOwner,
        }),
    params.userId
      ? snapshot.entityType === "class"
        ? deps.repository.getClassPurchaseState({
            rpgId: params.rpgId,
            userId: params.userId,
            classKey: snapshot.key,
            costsEnabled: snapshot.costsEnabled,
            costResourceName: snapshot.costResourceName,
          })
        : deps.repository.getRacePurchaseState({
            rpgId: params.rpgId,
            userId: params.userId,
            raceKey: snapshot.key,
          })
      : Promise.resolve({
          characterId: null,
          costsEnabled: snapshot.entityType === "class" ? snapshot.costsEnabled : false,
          costResourceName: snapshot.entityType === "class" ? snapshot.costResourceName : "Skill Points",
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
