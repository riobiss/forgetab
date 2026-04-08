import type { FastifyReply, FastifyRequest } from "fastify"
import { deleteSkill } from "@/application/skills/use-cases/deleteSkill"
import { getSkillById } from "@/application/skills/use-cases/getSkillById"
import { updateSkill } from "@/application/skills/use-cases/updateSkill"
import { parseJsonBody, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { skillRouteDeps } from "./dependencies"
import { requireUserId, type SkillRouteParams } from "./shared"

export async function getSkillByIdHandler(
  request: FastifyRequest<{ Params: SkillRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await getSkillById(
      { repository: skillRouteDeps.repository },
      { skillId: request.params.id, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar skill.")
  }
}

export async function updateSkillHandler(
  request: FastifyRequest<{ Params: SkillRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await updateSkill(
      { repository: skillRouteDeps.repository },
      { skillId: request.params.id, userId: auth.userId, body: parseJsonBody(request.body) },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao atualizar skill.")
  }
}

export async function deleteSkillHandler(
  request: FastifyRequest<{ Params: SkillRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await deleteSkill(
      { repository: skillRouteDeps.repository },
      { skillId: request.params.id, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover skill.")
  }
}
