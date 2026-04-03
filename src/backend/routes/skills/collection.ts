import { createSkill } from "@/application/skills/use-cases/createSkill"
import { getSkills } from "@/application/skills/use-cases/getSkills"
import { prismaSkillRepository } from "@/infrastructure/skills/repositories/prismaSkillRepository"
import { rpgPermissionService } from "@/infrastructure/skills/services/rpgPermissionService"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"
import { requireUserId } from "./shared"

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
