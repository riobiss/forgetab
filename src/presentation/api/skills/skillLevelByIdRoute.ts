import { NextRequest, NextResponse } from "next/server"
import { deleteSkillLevel } from "@/application/skills/use-cases/deleteSkillLevel"
import { updateSkillLevel } from "@/application/skills/use-cases/updateSkillLevel"
import { prismaSkillRepository } from "@/infrastructure/skills/repositories/prismaSkillRepository"
import { getUserIdFromRequest } from "@/lib/server/skillBuilder"
import { AppError } from "@/shared/errors/AppError"

type RouteContext = {
  params: Promise<{
    id: string
    levelId: string
  }>
}

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { id, levelId } = await context.params
    const body = await request.json()
    const payload = await updateSkillLevel(
      { repository: prismaSkillRepository },
      { skillId: id, levelId, userId, body },
    )
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar level.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { id, levelId } = await context.params
    const payload = await deleteSkillLevel(
      { repository: prismaSkillRepository },
      { skillId: id, levelId, userId },
    )
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover level.")
  }
}
