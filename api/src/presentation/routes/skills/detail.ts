import { deleteSkill } from "@/application/skills/use-cases/deleteSkill"
import { getSkillById } from "@/application/skills/use-cases/getSkillById"
import { updateSkill } from "@/application/skills/use-cases/updateSkill"
import { prismaSkillRepository } from "@/infrastructure/skills/repositories/prismaSkillRepository"
import { toErrorResponse } from "@api/presentation/http/responses/errors"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"
import { type SkillRouteParams, requireUserId } from "./shared"

export async function getSkillByIdHandler(request: Request, params: SkillRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getSkillById(
      { repository: prismaSkillRepository },
      { skillId: params.id, userId: auth.userId },
    )
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar skill.")
  }
}

export async function updateSkillHandler(request: Request, params: SkillRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await updateSkill(
      { repository: prismaSkillRepository },
      { skillId: params.id, userId: auth.userId, body },
    )
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar skill.")
  }
}

export async function deleteSkillHandler(request: Request, params: SkillRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteSkill(
      { repository: prismaSkillRepository },
      { skillId: params.id, userId: auth.userId },
    )
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover skill.")
  }
}
