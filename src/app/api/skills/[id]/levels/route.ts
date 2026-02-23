import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { deepCopyJson, fetchSkillById, getUserIdFromRequest } from "@/lib/server/skillBuilder"
import { skillLevelCreateSchema } from "@/lib/validators/skillBuilder"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { id } = await context.params
    const skill = await fetchSkillById(id, userId)
    if (!skill) {
      return NextResponse.json({ message: "Skill nao encontrada." }, { status: 404 })
    }

    const body = await request.json()
    const parsed = skillLevelCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const lastLevel = skill.levels[skill.levels.length - 1]
    const nextLevelNumber = (lastLevel?.levelNumber ?? 0) + 1
    const payload = parsed.data

    const nextSummary = payload.summary !== undefined ? payload.summary : lastLevel?.summary ?? null
    const nextLevelRequired =
      payload.levelRequired !== undefined
        ? payload.levelRequired
        : (lastLevel?.levelRequired ?? nextLevelNumber)
    const nextStats =
      payload.stats !== undefined ? payload.stats : deepCopyJson(lastLevel?.stats ?? null)
    const nextCost = payload.cost !== undefined ? payload.cost : deepCopyJson(lastLevel?.cost ?? null)
    const nextTarget =
      payload.target !== undefined ? payload.target : deepCopyJson(lastLevel?.target ?? null)
    const nextArea = payload.area !== undefined ? payload.area : deepCopyJson(lastLevel?.area ?? null)
    const nextScaling =
      payload.scaling !== undefined ? payload.scaling : deepCopyJson(lastLevel?.scaling ?? null)
    const nextRequirement =
      payload.requirement !== undefined
        ? payload.requirement
        : deepCopyJson(lastLevel?.requirement ?? null)
    const nextRequirementWithUpgrade =
      lastLevel
        ? {
            ...(nextRequirement && typeof nextRequirement === "object" ? nextRequirement : {}),
            upgradeFromSkillId: id,
            upgradeFromLevelId: lastLevel.id,
            upgradeFromLevelNumber: lastLevel.levelNumber,
          }
        : nextRequirement
    const nextEffects =
      payload.effects !== undefined ? payload.effects : deepCopyJson(lastLevel?.effects ?? [])

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO skill_levels (
          id,
          skill_id,
          level_number,
          level_required,
          summary,
          stats,
          cost,
          target,
          area,
          scaling,
          requirement,
          effects
        )
        VALUES (
          ${crypto.randomUUID()},
          ${id},
          ${nextLevelNumber},
          ${nextLevelRequired},
          ${nextSummary},
          ${nextStats ? Prisma.sql`${JSON.stringify(nextStats)}::jsonb` : Prisma.sql`NULL`},
          ${nextCost ? Prisma.sql`${JSON.stringify(nextCost)}::jsonb` : Prisma.sql`NULL`},
          ${nextTarget ? Prisma.sql`${JSON.stringify(nextTarget)}::jsonb` : Prisma.sql`NULL`},
          ${nextArea ? Prisma.sql`${JSON.stringify(nextArea)}::jsonb` : Prisma.sql`NULL`},
          ${nextScaling ? Prisma.sql`${JSON.stringify(nextScaling)}::jsonb` : Prisma.sql`NULL`},
          ${nextRequirementWithUpgrade
            ? Prisma.sql`${JSON.stringify(nextRequirementWithUpgrade)}::jsonb`
            : Prisma.sql`NULL`},
          ${JSON.stringify(nextEffects)}::jsonb
        )
      `)

      await tx.$executeRaw(Prisma.sql`
        UPDATE skills
        SET
          current_level = GREATEST(current_level, ${nextLevelNumber}),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
          AND owner_id = ${userId}
      `)
    })

    const updatedSkill = await fetchSkillById(id, userId)
    return NextResponse.json({ skill: updatedSkill }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "skill_levels" does not exist')) {
      return NextResponse.json(
        { message: "Tabela skill_levels nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao criar level." }, { status: 500 })
  }
}

