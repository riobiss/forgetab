import { NextRequest } from "next/server"
import { revalidateSkillsIndexTags } from "@/presentation/api/skills/cacheTags"
import { getUserIdFromRequest } from "@/lib/server/skillBuilder"
import {
  deleteSkillLevelHandler,
  updateSkillLevelHandler,
} from "@/backend/routes/skills/handlers"

type RouteContext = {
  params: Promise<{
    id: string
    levelId: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  const { id, levelId } = await context.params
  const response = await updateSkillLevelHandler(request, { id, levelId })

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
  const userId = await getUserIdFromRequest(request)
  const { id, levelId } = await context.params
  const response = await deleteSkillLevelHandler(request, { id, levelId })

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
