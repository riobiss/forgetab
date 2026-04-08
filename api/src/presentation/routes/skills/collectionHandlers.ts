import type { FastifyReply, FastifyRequest } from "fastify"
import { createSkill } from "@/application/skills/use-cases/createSkill"
import { getSkills } from "@/application/skills/use-cases/getSkills"
import { parseJsonBody, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { skillRouteDeps } from "./dependencies"
import { requireUserId } from "./shared"

export async function listSkillsHandler(
  request: FastifyRequest<{ Querystring: { rpgId?: string } }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await getSkills(
      { repository: skillRouteDeps.repository },
      { userId: auth.userId, rpgId: request.query.rpgId ?? null },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar skills.")
  }
}

export async function createSkillHandler(request: FastifyRequest, reply: FastifyReply) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) return auth.response

  try {
    const payload = await createSkill(
      {
        repository: skillRouteDeps.repository,
        permissionService: skillRouteDeps.permissionService,
      },
      { userId: auth.userId, body: parseJsonBody(request.body) },
    )

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar skill.")
  }
}
