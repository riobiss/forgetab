import type { RpgPermissionService } from "@/application/items/ports/RpgPermissionService"
import type { ItemsLayoutSessionService } from "@/application/items/layout/ports/ItemsLayoutSessionService"

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

  const canManage = await deps.permissionService.canManageRpg(params.rpgId, userId)
  return { allowed: canManage }
}
