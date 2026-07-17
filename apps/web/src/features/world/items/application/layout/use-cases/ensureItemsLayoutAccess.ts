import type { RpgPermissionService } from "@/features/world/items/application/items/ports/RpgPermissionService"
import type { ItemsLayoutSessionService } from "@/features/world/items/application/layout/ports/ItemsLayoutSessionService"

export async function ensureItemsLayoutAccessUseCase(
  deps: {
    sessionService: ItemsLayoutSessionService
    permissionService: RpgPermissionService
  },
  params: { rpgId: string },
) {
  const userId = await deps.sessionService.getCurrentUserId()
  if (!userId) {
    return { allowed: false as const }
  }

  const canManage = await deps.permissionService.canManageRpg(
    params.rpgId,
    userId,
  )
  return { allowed: canManage }
}
