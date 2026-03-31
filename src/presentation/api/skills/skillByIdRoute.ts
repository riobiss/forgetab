import { NextRequest } from "next/server"
import { revalidateSkillsIndexTags } from "@/presentation/api/skills/cacheTags"
import { getUserIdFromRequest } from "@/lib/server/skillBuilder"
import {
  deleteSkillHandler,
  getSkillByIdHandler,
  updateSkillHandler,
} from "@/backend/routes/skills/handlers"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

async function getUserIdOr401(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  return userId ?? null
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return getSkillByIdHandler(request, { id })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdOr401(request)
  const { id } = await context.params
  const response = await updateSkillHandler(request, { id })

  if (response.ok && userId) {
    const payload = (await response.clone().json()) as {
      skill?: { rpgId?: string | null }
    }
    revalidateSkillsIndexTags({
      userId,
      rpgId: payload.skill?.rpgId ?? null,
    })
  }

  return response
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdOr401(request)
  const { id } = await context.params
  const response = await deleteSkillHandler(request, { id })

  if (response.ok && userId) {
    const payload = (await response.clone().json()) as { rpgId?: string | null }
    revalidateSkillsIndexTags({
      userId,
      rpgId: payload.rpgId ?? null,
    })
  }

  return response
}
