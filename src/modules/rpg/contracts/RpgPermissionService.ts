import type { RpgPermission } from "@/lib/server/rpgPermissions"

export interface RpgPermissionService {
  getPermission(rpgId: string, userId: string): Promise<RpgPermission>
}
