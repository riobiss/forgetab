import type { NotesAccessService } from "@/features/world/notes/application/ports/NotesAccessService"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const notesAccessService: NotesAccessService = {
  async getCampaignAccess(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return {
      exists: permission.exists,
      canUseNotes: permission.isOwner || permission.isAcceptedMember
    }
  }
}
