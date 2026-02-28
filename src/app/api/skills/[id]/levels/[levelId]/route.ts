import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { fetchSkillById, getUserIdFromRequest } from "@/lib/server/skillBuilder"
import { skillLevelPatchSchema } from "@/lib/validators/skillBuilder"

type RouteContext = {
  params: Promise<{
    id: string
    levelId: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { id, levelId } = await context.params
    const skill = await fetchSkillById(id, userId)
    if (!skill) {
      return NextResponse.json({ message: "Skill nao encontrada." }, { status: 404 })
    }

    const level = skill.levels.find((item) => item.id === levelId)
    if (!level) {
      return NextResponse.json({ message: "Level nao encontrado." }, { status: 404 })
    }

    const body = await request.json()
    const parsed = skillLevelPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const nextLevelRequired = parsed.data.levelRequired ?? level.levelRequired
    const nextSummary = parsed.data.summary !== undefined ? parsed.data.summary : level.summary
    const nextStats = parsed.data.stats !== undefined ? parsed.data.stats : level.stats
    const nextCost = parsed.data.cost !== undefined ? parsed.data.cost : level.cost
    const nextTarget = parsed.data.target !== undefined ? parsed.data.target : level.target
    const nextArea = parsed.data.area !== undefined ? parsed.data.area : level.area
    const nextScaling = parsed.data.scaling !== undefined ? parsed.data.scaling : level.scaling
    const nextRequirement =
      parsed.data.requirement !== undefined ? parsed.data.requirement : level.requirement

    await prisma.$executeRaw(Prisma.sql`
      UPDATE skill_levels
      SET
        level_required = ${nextLevelRequired},
        summary = ${nextSummary ?? null},
        stats = ${nextStats ? Prisma.sql`${JSON.stringify(nextStats)}::jsonb` : Prisma.sql`NULL`},
        cost = ${nextCost ? Prisma.sql`${JSON.stringify(nextCost)}::jsonb` : Prisma.sql`NULL`},
        target = ${nextTarget ? Prisma.sql`${JSON.stringify(nextTarget)}::jsonb` : Prisma.sql`NULL`},
        area = ${nextArea ? Prisma.sql`${JSON.stringify(nextArea)}::jsonb` : Prisma.sql`NULL`},
        scaling = ${nextScaling ? Prisma.sql`${JSON.stringify(nextScaling)}::jsonb` : Prisma.sql`NULL`},
        requirement = ${nextRequirement
          ? Prisma.sql`${JSON.stringify(nextRequirement)}::jsonb`
          : Prisma.sql`NULL`},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${levelId}
        AND skill_id = ${id}
    `)

    const updatedSkill = await fetchSkillById(id, userId)
    return NextResponse.json({ skill: updatedSkill }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "skill_levels" does not exist')) {
      return NextResponse.json(
        { message: "Tabela skill_levels nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao atualizar level." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { id, levelId } = await context.params
    const skill = await fetchSkillById(id, userId)
    if (!skill) {
      return NextResponse.json({ message: "Skill nao encontrada." }, { status: 404 })
    }

    const level = skill.levels.find((item) => item.id === levelId)
    if (!level) {
      return NextResponse.json({ message: "Level nao encontrado." }, { status: 404 })
    }

    if (skill.levels.length <= 1) {
      return NextResponse.json(
        { message: "Nao e possivel remover o ultimo level da habilidade." },
        { status: 400 },
      )
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM skill_levels
      WHERE id = ${levelId}
        AND skill_id = ${id}
    `)

    const updatedSkill = await fetchSkillById(id, userId)
    return NextResponse.json({ skill: updatedSkill }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "skill_levels" does not exist')) {
      return NextResponse.json(
        { message: "Tabela skill_levels nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao remover level." }, { status: 500 })
  }
}

