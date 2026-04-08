import type { FastifyReply, FastifyRequest } from "fastify"
import { createSkillLevel } from "@/application/skills/use-cases/createSkillLevel"
import { deleteSkillLevel } from "@/application/skills/use-cases/deleteSkillLevel"
import { updateSkillLevel } from "@/application/skills/use-cases/updateSkillLevel"
import { parseJsonBody, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { skillRouteDeps } from "./dependencies"
import { requireUserId, type SkillLevelRouteParams, type SkillRouteParams } from "./shared"

export async function createSkillLevelHandler(
  request: FastifyRequest<{ Params: SkillRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await createSkillLevel(
      { repository: skillRouteDeps.repository },
      { skillId: request.params.id, userId: auth.userId, body: parseJsonBody(request.body) },
    )
    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar level.")
  }
}

export async function updateSkillLevelHandler(
  request: FastifyRequest<{ Params: SkillLevelRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await updateSkillLevel(
      { repository: skillRouteDeps.repository },
      {
        skillId: request.params.id,
        levelId: request.params.levelId,
        userId: auth.userId,
        body: parseJsonBody(request.body),
      },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar level.")
  }
}

export async function deleteSkillLevelHandler(
  request: FastifyRequest<{ Params: SkillLevelRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await deleteSkillLevel(
      { repository: skillRouteDeps.repository },
      { skillId: request.params.id, levelId: request.params.levelId, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover level.")
  }
}
