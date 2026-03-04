import { NextRequest, NextResponse } from "next/server"
import { revalidateSkillsIndexTags } from "@/presentation/api/skills/cacheTags"
import { createSkill } from "@/application/skills/use-cases/createSkill"
import { getSkills } from "@/application/skills/use-cases/getSkills"
import { prismaSkillRepository } from "@/infrastructure/skills/repositories/prismaSkillRepository"
import { rpgPermissionService } from "@/infrastructure/skills/services/rpgPermissionService"
import { getUserIdFromRequest } from "@/lib/server/skillBuilder"
import { AppError } from "@/shared/errors/AppError"

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const rpgId = request.nextUrl.searchParams.get("rpgId")
    const payload = await getSkills({ repository: prismaSkillRepository }, { userId, rpgId })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar skills.")
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = await createSkill(
      {
        repository: prismaSkillRepository,
        permissionService: rpgPermissionService,
      },
      { userId, body },
    )
    revalidateSkillsIndexTags({
      userId,
      rpgId: payload.skill?.rpgId ?? null,
    })
    return NextResponse.json(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar skill.")
  }
}
