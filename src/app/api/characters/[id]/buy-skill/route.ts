import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { getUserIdFromRequest } from "@/lib/server/auth"
import { parseCharacterAbilities, parseCostPoints } from "@/lib/server/costSystem"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type CharacterLockedRow = {
  id: string
  rpgId: string
  ownerId: string
  createdByUserId: string | null
  classKey: string | null
  characterType: "player" | "npc" | "monster"
  skillPoints: number
  abilities: Prisma.JsonValue
  costsEnabled: boolean
}

type SkillLevelRow = {
  levelNumber: number
  cost: Prisma.JsonValue
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const body = (await request.json()) as {
      skillId?: unknown
      level?: unknown
    }
    if (typeof body.skillId !== "string" || !body.skillId.trim()) {
      return NextResponse.json({ message: "skillId e obrigatorio." }, { status: 400 })
    }
    const normalizedSkillId = body.skillId.trim()
    if (typeof body.level !== "number" || !Number.isInteger(body.level) || body.level <= 0) {
      return NextResponse.json(
        { message: "level deve ser um inteiro positivo." },
        { status: 400 },
      )
    }
    const normalizedLevel = body.level

    const { id } = await context.params
    const result = await prisma.$transaction(async (tx) => {
      const characterRows = await tx.$queryRaw<CharacterLockedRow[]>(Prisma.sql`
        SELECT
          c.id,
          c.rpg_id AS "rpgId",
          r.owner_id AS "ownerId",
          c.created_by_user_id AS "createdByUserId",
          c.class_key AS "classKey",
          c.character_type AS "characterType",
          c.skill_points AS "skillPoints",
          c.abilities,
          COALESCE(r.costs_enabled, false) AS "costsEnabled"
        FROM rpg_characters c
        INNER JOIN rpgs r ON r.id = c.rpg_id
        WHERE c.id = ${id}
        FOR UPDATE
      `)

      const character = characterRows[0]
      if (!character) {
        return { status: 404 as const, message: "Personagem nao encontrado." }
      }
      if (character.characterType !== "player") {
        return {
          status: 400 as const,
          message: "Somente personagens do tipo player podem comprar habilidades.",
        }
      }
      const canManageCharacter =
        character.createdByUserId === userId || character.ownerId === userId
      if (!canManageCharacter) {
        return {
          status: 403 as const,
          message: "Sem permissao para comprar habilidades neste personagem.",
        }
      }
      if (!character.costsEnabled) {
        return {
          status: 400 as const,
          message: "Sistema de custos desativado neste RPG.",
        }
      }
      if (!character.classKey) {
        return {
          status: 400 as const,
          message: "Personagem sem classe definida.",
        }
      }

      const classSkillRows = await tx.$queryRaw<Array<{ skillId: string }>>(Prisma.sql`
        SELECT s.id AS "skillId"
        FROM skills s
        INNER JOIN skill_class_links scl ON scl.skill_id = s.id
        INNER JOIN rpg_class_templates ct ON ct.id = scl.class_template_id
        WHERE s.id = ${normalizedSkillId}
          AND s.rpg_id = ${character.rpgId}
          AND ct.rpg_id = ${character.rpgId}
          AND (
            ct.key = ${character.classKey}
            OR ct.id = ${character.classKey}
          )
        LIMIT 1
      `)

      if (classSkillRows.length === 0) {
        return {
          status: 400 as const,
          message: "Nao e permitido comprar habilidade de outra classe.",
        }
      }

      const levelRows = await tx.$queryRaw<SkillLevelRow[]>(Prisma.sql`
        SELECT
          level_number AS "levelNumber",
          cost
        FROM skill_levels
        WHERE skill_id = ${normalizedSkillId}
          AND level_number = ${normalizedLevel}
        LIMIT 1
      `)
      const skillLevel = levelRows[0]
      if (!skillLevel) {
        return {
          status: 404 as const,
          message: "Level da habilidade nao encontrado.",
        }
      }

      const costPoints = parseCostPoints(skillLevel.cost)
      if (costPoints === null) {
        return {
          status: 400 as const,
          message: "Level da habilidade sem custo de pontos configurado.",
        }
      }

      const ownedAbilities = parseCharacterAbilities(character.abilities)
      const alreadyHasLevel = ownedAbilities.some(
        (item) => item.skillId === normalizedSkillId && item.level === normalizedLevel,
      )
      if (alreadyHasLevel) {
        return {
          status: 409 as const,
          message: "Personagem ja possui este level da habilidade.",
        }
      }

      if (normalizedLevel > 1) {
        const hasPreviousLevel = ownedAbilities.some(
          (item) => item.skillId === normalizedSkillId && item.level === normalizedLevel - 1,
        )
        if (!hasPreviousLevel) {
          return {
            status: 400 as const,
            message: `Para comprar o level ${normalizedLevel}, primeiro compre o level ${normalizedLevel - 1}.`,
          }
        }
      }

      if (character.skillPoints < costPoints) {
        return {
          status: 400 as const,
          message: "Pontos insuficientes para comprar esta habilidade.",
        }
      }

      const nextAbilities = [
        ...ownedAbilities.filter((item) => item.skillId !== normalizedSkillId),
        {
          skillId: normalizedSkillId,
          level: normalizedLevel,
        },
      ]

      const updated = await tx.rpgCharacter.update({
        where: { id: character.id },
        data: {
          skillPoints: {
            decrement: costPoints,
          },
          abilities: nextAbilities as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
        select: {
          skillPoints: true,
        },
      })

      return {
        status: 200 as const,
        success: true,
        remainingPoints: updated.skillPoints ?? 0,
      }
    })

    if ("success" in result) {
      return NextResponse.json(result, { status: result.status })
    }
    return NextResponse.json({ message: result.message }, { status: result.status })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('column "skill_points" does not exist') ||
        error.message.includes('column "abilities" does not exist') ||
        error.message.includes('column "costs_enabled" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura de custos desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao comprar habilidade." },
      { status: 500 },
    )
  }
}

