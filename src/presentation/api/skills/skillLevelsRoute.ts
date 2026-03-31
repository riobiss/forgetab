import { NextRequest } from "next/server"
import { revalidateSkillsIndexTags } from "@/presentation/api/skills/cacheTags"
import { getUserIdFromRequest } from "@/lib/server/skillBuilder"
import { createSkillLevelHandler } from "@/backend/routes/skills/handlers"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  const { id } = await context.params
  const response = await createSkillLevelHandler(request, { id })

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
