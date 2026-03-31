import { NextRequest } from "next/server"
import { revalidateSkillsIndexTags } from "@/presentation/api/skills/cacheTags"
import { getUserIdFromRequest } from "@/lib/server/skillBuilder"
import { createSkillHandler, listSkillsHandler } from "@/backend/routes/skills/handlers"

export async function GET(request: NextRequest) {
  return listSkillsHandler(request)
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  const response = await createSkillHandler(request)

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
