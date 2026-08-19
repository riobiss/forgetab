import { AppError } from "@/features/shared/application/errors/AppError"
import type { AccessDependencies } from "./dependencies"

export async function ensureCampaignNotesAccess(
  dependencies: AccessDependencies,
  rpgId: string,
  userId: string
) {
  const access = await dependencies.accessService.getCampaignAccess(
    rpgId,
    userId
  )
  if (!access.exists) throw new AppError("Campanha nao encontrada.", 404)
  if (!access.canUseNotes) {
    throw new AppError("Voce nao tem acesso a esta campanha.", 403)
  }
}
