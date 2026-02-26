import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { getUserIdFromRequest } from "@/lib/server/auth"
import { getRpgAccess } from "@/lib/server/characters/access"
import {
  createCharacter,
  CreateCharacterError,
} from "@/lib/server/characters/createCharacter"
import type {
  CharacterRow,
  CreateCharacterPayload,
  RouteContext,
} from "@/lib/server/characters/types"

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const access = await getRpgAccess(rpgId, userId)
    if (!access.exists || !access.canAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    let characters: CharacterRow[] = []
    try {
      characters = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
        SELECT
          id,
          rpg_id AS "rpgId",
          name,
          image,
          race_key AS "raceKey",
          class_key AS "classKey",
          character_type AS "characterType",
          visibility,
          max_carry_weight AS "maxCarryWeight",
          COALESCE(progression_mode, 'xp_level') AS "progressionMode",
          COALESCE(progression_label, 'Level 1') AS "progressionLabel",
          COALESCE(progression_required, 0) AS "progressionRequired",
          COALESCE(progression_current, 0) AS "progressionCurrent",
          created_by_user_id AS "createdByUserId",
          life,
          defense,
          mana,
          stamina AS exhaustion,
          sanity,
          statuses,
          COALESCE(current_statuses, '{}'::jsonb) AS "currentStatuses",
          attributes,
          skills,
          COALESCE(identity, '{}'::jsonb) AS identity,
          COALESCE(characteristics, '{}'::jsonb) AS characteristics,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM rpg_characters
        WHERE rpg_id = ${rpgId}
          ${
            access.isOwner
              ? Prisma.empty
              : userId
                ? Prisma.sql`AND (visibility = 'public'::"RpgVisibility" OR created_by_user_id = ${userId})`
                : Prisma.sql`AND visibility = 'public'::"RpgVisibility"`
          }
        ORDER BY created_at DESC
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "race_key" does not exist') ||
          error.message.includes('column "class_key" does not exist') ||
          error.message.includes('column "max_carry_weight" does not exist') ||
          error.message.includes('column "current_statuses" does not exist') ||
          error.message.includes('column "identity" does not exist') ||
          error.message.includes('column "characteristics" does not exist') ||
          error.message.includes('column "progression_mode" does not exist') ||
          error.message.includes('column "progression_label" does not exist') ||
          error.message.includes('column "progression_required" does not exist') ||
          error.message.includes('column "progression_current" does not exist'))
      ) {
        characters = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
          SELECT
            id,
            rpg_id AS "rpgId",
            name,
            null::text AS "image",
            null::text AS "raceKey",
            null::text AS "classKey",
            character_type AS "characterType",
            visibility,
            null::double precision AS "maxCarryWeight",
            'xp_level'::text AS "progressionMode",
            'Level 1'::text AS "progressionLabel",
            0::integer AS "progressionRequired",
            0::integer AS "progressionCurrent",
            created_by_user_id AS "createdByUserId",
            life,
            defense,
            mana,
            stamina AS exhaustion,
            sanity,
            statuses,
            '{}'::jsonb AS "currentStatuses",
            attributes,
            skills,
            '{}'::jsonb AS identity,
            '{}'::jsonb AS characteristics,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM rpg_characters
          WHERE rpg_id = ${rpgId}
            ${
              access.isOwner
                ? Prisma.empty
                : userId
                  ? Prisma.sql`AND (visibility = 'public'::"RpgVisibility" OR created_by_user_id = ${userId})`
                  : Prisma.sql`AND visibility = 'public'::"RpgVisibility"`
            }
          ORDER BY created_at DESC
        `)
      } else {
        throw error
      }
    }

    return NextResponse.json(
      {
        characters,
        isOwner: access.isOwner,
        useRaceBonuses: access.useRaceBonuses,
      useClassBonuses: access.useClassBonuses,
      useInventoryWeightLimit: access.useInventoryWeightLimit,
      allowMultiplePlayerCharacters: access.allowMultiplePlayerCharacters,
      progressionMode: access.progressionMode,
      progressionTiers: access.progressionTiers,
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "skills" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "image" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "progression_mode" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_label" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_required" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_current" of relation "rpg_characters" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao listar personagens." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const access = await getRpgAccess(rpgId, userId)
    if (!access.exists || !access.canAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const payload = (await request.json()) as CreateCharacterPayload
    const character = await createCharacter({
      rpgId,
      userId,
      access,
      payload,
    })

    return NextResponse.json({ character }, { status: 201 })
  } catch (error) {
    if (error instanceof CreateCharacterError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    if (
      error instanceof Error &&
      error.message.includes('column "use_inventory_weight_limit" does not exist')
    ) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      error.message.includes('column "allow_multiple_player_characters" does not exist')
    ) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "progression_mode" does not exist') ||
        error.message.includes('column "progression_tiers" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao criar personagem." },
      { status: 500 },
    )
  }
}
