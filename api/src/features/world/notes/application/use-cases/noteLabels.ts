import { AppError } from "@/features/shared/application/errors/AppError"
import type { LabelDependencies } from "./dependencies"
import { ensureCampaignNotesAccess } from "./ensureCampaignNotesAccess"
import { normalizeLabelName } from "./notesValidation"

export async function listNoteLabels(
  dependencies: LabelDependencies,
  input: { rpgId: string; userId: string }
) {
  await ensureCampaignNotesAccess(dependencies, input.rpgId, input.userId)
  return {
    labels: await dependencies.labelRepository.listLabels(
      input.rpgId,
      input.userId
    )
  }
}

export async function createNoteLabel(
  dependencies: LabelDependencies,
  input: { rpgId: string; userId: string; name: string }
) {
  await ensureCampaignNotesAccess(dependencies, input.rpgId, input.userId)
  const label = await dependencies.labelRepository.createLabel(
    input.rpgId,
    input.userId,
    normalizeLabelName(input.name)
  )
  if (!label) throw new AppError("Ja existe um marcador com esse nome.", 409)
  return { label }
}

export async function updateNoteLabel(
  dependencies: LabelDependencies,
  input: { rpgId: string; userId: string; labelId: string; name: string }
) {
  await ensureCampaignNotesAccess(dependencies, input.rpgId, input.userId)
  const label = await dependencies.labelRepository.updateLabel(
    input.rpgId,
    input.userId,
    input.labelId,
    normalizeLabelName(input.name)
  )
  if (!label) {
    throw new AppError("Marcador nao encontrado ou nome duplicado.", 404)
  }
  return { label }
}

export async function deleteNoteLabel(
  dependencies: LabelDependencies,
  input: { rpgId: string; userId: string; labelId: string }
) {
  await ensureCampaignNotesAccess(dependencies, input.rpgId, input.userId)
  const deleted = await dependencies.labelRepository.deleteLabel(
    input.rpgId,
    input.userId,
    input.labelId
  )
  if (!deleted) throw new AppError("Marcador nao encontrado.", 404)
  return { message: "Marcador excluido." }
}
