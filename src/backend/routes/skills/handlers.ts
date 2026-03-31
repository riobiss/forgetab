import { createSkill } from "@/application/skills/use-cases/createSkill"
import { createSkillLevel } from "@/application/skills/use-cases/createSkillLevel"
import { deleteSkill } from "@/application/skills/use-cases/deleteSkill"
import { deleteSkillLevel } from "@/application/skills/use-cases/deleteSkillLevel"
import { getSkillById } from "@/application/skills/use-cases/getSkillById"
import { getSkills } from "@/application/skills/use-cases/getSkills"
import { updateSkill } from "@/application/skills/use-cases/updateSkill"
import { updateSkillLevel } from "@/application/skills/use-cases/updateSkillLevel"
import {
  loadSkillsSearchIndexUseCase,
  normalizeSkillSearchIndexParams,
} from "@/application/skillsSearchIndex/use-cases/skillsSearchIndex"
import { prismaSkillRepository } from "@/infrastructure/skills/repositories/prismaSkillRepository"
import { rpgPermissionService } from "@/infrastructure/skills/services/rpgPermissionService"
import { prismaSkillsSearchIndexRepository } from "@/infrastructure/skillsSearchIndex/repositories/prismaSkillsSearchIndexRepository"
import { getUserIdFromRequest } from "@/backend/auth/requestAuth"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"

type SkillRouteParams = { id: string }
type SkillLevelRouteParams = { id: string; levelId: string }

async function requireUserId(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 }),
    }
  }

  return { ok: true as const, userId }
}

export async function listSkillsHandler(request: Request) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const rpgId = new URL(request.url).searchParams.get("rpgId")
    const payload = await getSkills({ repository: prismaSkillRepository }, { userId: auth.userId, rpgId })
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar skills.")
  }
}

export async function createSkillHandler(request: Request) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await createSkill(
      {
        repository: prismaSkillRepository,
        permissionService: rpgPermissionService,
      },
      { userId: auth.userId, body },
    )

    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar skill.")
  }
}

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

export async function getSkillsSearchIndexHandler(request: Request) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = (await request.json()) as { skillIds?: unknown; rpgId?: unknown }
    const { skillIds, rpgId } = normalizeSkillSearchIndexParams(body)

    if (skillIds.length === 0) {
      return jsonResponse({ index: {} }, { status: 200 })
    }

    const index = await loadSkillsSearchIndexUseCase(
      { repository: prismaSkillsSearchIndexRepository },
      { userId: auth.userId, skillIds, rpgId },
    )

    return jsonResponse({ index }, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao montar indice de busca.")
  }
}
