import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { getUserIdFromRequest } from "@/lib/server/auth"
import { getRpgPermission } from "@/lib/server/rpgPermissions"
import {
  isProgressionMode,
  normalizeProgressionTiers,
  resolveProgressionTierByCurrent,
  type ProgressionMode,
} from "@/lib/rpg/progression"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type CharacterRow = {
  id: string
  rpgId: string
  characterType: "player" | "npc" | "monster"
  progressionMode: string
  progressionTiers: Prisma.JsonValue
  progressionCurrent: number
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const body = (await request.json()) as { amount?: unknown }
    if (
      typeof body.amount !== "number" ||
      !Number.isInteger(body.amount) ||
      body.amount <= 0
    ) {
      return NextResponse.json(
        { message: "amount deve ser um inteiro maior que zero." },
        { status: 400 },
      )
    }

    const { id } = await context.params
    const characterRows = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      SELECT
        c.id,
        c.rpg_id AS "rpgId",
        c.character_type AS "characterType",
        COALESCE(r.progression_mode, 'xp_level') AS "progressionMode",
        COALESCE(r.progression_tiers, '[{"label":"Level 1","required":0}]'::jsonb) AS "progressionTiers",
        COALESCE(c.progression_current, 0) AS "progressionCurrent"
      FROM rpg_characters c
      INNER JOIN rpgs r ON r.id = c.rpg_id
      WHERE c.id = ${id}
      LIMIT 1
    `)

    const character = characterRows[0]
    if (!character) {
      return NextResponse.json({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    const permission = await getRpgPermission(character.rpgId, userId)
    if (!permission.canManage) {
      return NextResponse.json(
        { message: "Apenas mestre ou moderador podem conceder XP." },
        { status: 403 },
      )
    }

    if (character.characterType !== "player") {
      return NextResponse.json(
        { message: "Somente personagens do tipo player podem receber XP." },
        { status: 400 },
      )
    }

    const nextProgressionCurrent = Math.max(0, character.progressionCurrent + body.amount)
    const progressionMode = isProgressionMode(character.progressionMode)
      ? character.progressionMode
      : ("xp_level" as ProgressionMode)
    const progressionTiers = normalizeProgressionTiers(character.progressionTiers, progressionMode)
    const resolvedTier = resolveProgressionTierByCurrent(
      progressionMode,
      progressionTiers,
      nextProgressionCurrent,
    )

    const updated = await prisma.$queryRaw<
      Array<{ progressionCurrent: number; progressionLabel: string; progressionRequired: number }>
    >(Prisma.sql`
      UPDATE rpg_characters
      SET
        progression_current = ${nextProgressionCurrent},
        progression_label = ${resolvedTier.label},
        progression_required = ${resolvedTier.required},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING
        progression_current AS "progressionCurrent",
        progression_label AS "progressionLabel",
        progression_required AS "progressionRequired"
    `)

    return NextResponse.json(
      {
        success: true,
        progressionCurrent: updated[0]?.progressionCurrent ?? nextProgressionCurrent,
        progressionLabel: updated[0]?.progressionLabel ?? resolvedTier.label,
        progressionRequired: updated[0]?.progressionRequired ?? resolvedTier.required,
      },
      { status: 200 },
    )
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('column "progression_mode" does not exist') ||
        error.message.includes('column "progression_tiers" does not exist') ||
        error.message.includes('column "progression_current" does not exist') ||
        error.message.includes('column "progression_label" does not exist') ||
        error.message.includes('column "progression_required" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura de progressao desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao conceder XP." },
      { status: 500 },
    )
  }
}
