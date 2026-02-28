import { NextRequest, NextResponse } from "next/server"
import { deleteSkill } from "@/application/skills/use-cases/deleteSkill"
import { getSkillById } from "@/application/skills/use-cases/getSkillById"
import { updateSkill } from "@/application/skills/use-cases/updateSkill"
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

async function getUserIdOr401(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return { ok: false as const, response: NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 }) }
  }

  return { ok: true as const, userId }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await getUserIdOr401(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const { id } = await context.params
    const payload = await getSkillById(
      { repository: prismaSkillRepository },
      { skillId: id, userId: auth.userId },
    )
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar skill.")
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await getUserIdOr401(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const { id } = await context.params
    const body = await request.json()
    const payload = await updateSkill(
      { repository: prismaSkillRepository },
      { skillId: id, userId: auth.userId, body },
    )
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar skill.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await getUserIdOr401(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const { id } = await context.params
    const payload = await deleteSkill(
      { repository: prismaSkillRepository },
      { skillId: id, userId: auth.userId },
    )
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover skill.")
  }
}
