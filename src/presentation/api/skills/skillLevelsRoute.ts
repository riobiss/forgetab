import { NextRequest, NextResponse } from "next/server"
import { revalidateSkillsIndexTags } from "@/presentation/api/skills/cacheTags"
import { createSkillLevel } from "@/application/skills/use-cases/createSkillLevel"
import { prismaSkillRepository } from "@/infrastructure/skills/repositories/prismaSkillRepository"
import { getUserIdFromRequest } from "@/lib/server/skillBuilder"
import { AppError } from "@/shared/errors/AppError"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const body = await request.json()
    const payload = await createSkillLevel(
      { repository: prismaSkillRepository },
      { skillId: id, userId, body },
    )
    revalidateSkillsIndexTags({
      userId,
      rpgId: payload.skill?.rpgId ?? null,
    })
    return NextResponse.json(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar level.")
  }
}
