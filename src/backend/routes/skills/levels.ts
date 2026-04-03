import { createSkillLevel } from "@/application/skills/use-cases/createSkillLevel"
import { deleteSkillLevel } from "@/application/skills/use-cases/deleteSkillLevel"
import { updateSkillLevel } from "@/application/skills/use-cases/updateSkillLevel"
import { prismaSkillRepository } from "@/infrastructure/skills/repositories/prismaSkillRepository"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"
import { type SkillLevelRouteParams, type SkillRouteParams, requireUserId } from "./shared"

export async function createSkillLevelHandler(request: Request, params: SkillRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await createSkillLevel(
      { repository: prismaSkillRepository },
      { skillId: params.id, userId: auth.userId, body },
    )
    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar level.")
  }
}

export async function updateSkillLevelHandler(request: Request, params: SkillLevelRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await updateSkillLevel(
      { repository: prismaSkillRepository },
      { skillId: params.id, levelId: params.levelId, userId: auth.userId, body },
    )
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar level.")
  }
}

export async function deleteSkillLevelHandler(request: Request, params: SkillLevelRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteSkillLevel(
      { repository: prismaSkillRepository },
      { skillId: params.id, levelId: params.levelId, userId: auth.userId },
    )
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover level.")
  }
}
