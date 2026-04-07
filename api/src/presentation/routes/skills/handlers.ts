import type { FastifyReply, FastifyRequest } from "fastify"
import { createSkill } from "@/application/skills/use-cases/createSkill"
import { getSkills } from "@/application/skills/use-cases/getSkills"
import { deleteSkill } from "@/application/skills/use-cases/deleteSkill"
import { getSkillById } from "@/application/skills/use-cases/getSkillById"
import { updateSkill } from "@/application/skills/use-cases/updateSkill"
import { createSkillLevel } from "@/application/skills/use-cases/createSkillLevel"
import { deleteSkillLevel } from "@/application/skills/use-cases/deleteSkillLevel"
import { updateSkillLevel } from "@/application/skills/use-cases/updateSkillLevel"
import {
  loadSkillsSearchIndexUseCase,
  normalizeSkillSearchIndexParams,
} from "@/application/skillsSearchIndex/use-cases/skillsSearchIndex"
import { prismaSkillRepository } from "@/infrastructure/skills/repositories/prismaSkillRepository"
import { prismaSkillsSearchIndexRepository } from "@/infrastructure/skillsSearchIndex/repositories/prismaSkillsSearchIndexRepository"
import { rpgPermissionService } from "@/infrastructure/skills/services/rpgPermissionService"
import { parseJsonBody, writeError, writeJson } from "@api/presentation/http/fastifyJson"
import { requireUserId, type SkillLevelRouteParams, type SkillRouteParams } from "./shared"

export async function listSkillsHandler(
  request: FastifyRequest<{ Querystring: { rpgId?: string } }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getSkills(
      { repository: prismaSkillRepository },
      { userId: auth.userId, rpgId: request.query.rpgId ?? null },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao buscar skills.")
  }
}

export async function createSkillHandler(request: FastifyRequest, reply: FastifyReply) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await createSkill(
      {
        repository: prismaSkillRepository,
        permissionService: rpgPermissionService,
      },
      { userId: auth.userId, body: parseJsonBody(request.body) },
    )

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar skill.")
  }
}

export async function getSkillByIdHandler(
  request: FastifyRequest<{ Params: SkillRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getSkillById(
      { repository: prismaSkillRepository },
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
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await updateSkill(
      { repository: prismaSkillRepository },
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
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteSkill(
      { repository: prismaSkillRepository },
      { skillId: request.params.id, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover skill.")
  }
}

export async function createSkillLevelHandler(
  request: FastifyRequest<{ Params: SkillRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await createSkillLevel(
      { repository: prismaSkillRepository },
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
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await updateSkillLevel(
      { repository: prismaSkillRepository },
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
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteSkillLevel(
      { repository: prismaSkillRepository },
      { skillId: request.params.id, levelId: request.params.levelId, userId: auth.userId },
    )
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao remover level.")
  }
}

export function getSkillsSearchIndexPayload(
  userId: string,
  skillIds: string[],
  rpgId?: string | null,
) {
  return loadSkillsSearchIndexUseCase(
    { repository: prismaSkillsSearchIndexRepository },
    { userId, skillIds, rpgId },
  )
}

export async function getSkillsSearchIndexHandler(request: FastifyRequest, reply: FastifyReply) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = parseJsonBody(request.body) as { skillIds?: unknown; rpgId?: unknown }
    const { skillIds, rpgId } = normalizeSkillSearchIndexParams(body)

    if (skillIds.length === 0) {
      return writeJson(reply, 200, { index: {} })
    }

    const index = await getSkillsSearchIndexPayload(auth.userId, skillIds, rpgId)
    return writeJson(reply, 200, { index })
  } catch (error) {
    return writeError(reply, error, "Erro interno ao montar indice de busca.")
  }
}
