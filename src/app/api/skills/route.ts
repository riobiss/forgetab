import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import {
  fetchRpgAbilityCategoryConfig,
  fetchSkillList,
  fetchSkillById,
  getUserIdFromRequest,
  validateLinkIds,
} from "@/lib/server/skillBuilder"
import { getRpgPermission } from "@/lib/server/rpgPermissions"
import {
  buildSkillSlug,
  createRpgScope,
  skillMetaCreateSchema,
} from "@/lib/validators/skillBuilder"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const rpgId = request.nextUrl.searchParams.get("rpgId")
    const rows = await fetchSkillList(userId, rpgId)

    return NextResponse.json({ skills: rows }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "skills" does not exist')) {
      return NextResponse.json(
        { message: "Tabela skills nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao buscar skills." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const body = await request.json()
    const parsed = skillMetaCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const rpgId = parsed.data.rpgId ?? null
    if (rpgId) {
      const permission = await getRpgPermission(rpgId, userId)
      if (!permission.canManage) {
        return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
      }
    }

    const abilityCategoryConfig = await fetchRpgAbilityCategoryConfig(rpgId)
    if (abilityCategoryConfig.enabled && abilityCategoryConfig.categories.length === 0) {
      return NextResponse.json({ message: "Ative pelo menos uma categoria" }, { status: 400 })
    }
    if (abilityCategoryConfig.enabled) {
      if (!parsed.data.category) {
        return NextResponse.json(
          { message: "Categoria obrigatoria para criar habilidade." },
          { status: 400 },
        )
      }
      if (!abilityCategoryConfig.categories.includes(parsed.data.category)) {
        return NextResponse.json(
          { message: "Categoria desativada para este RPG." },
          { status: 400 },
        )
      }
    }

    const validatedLinks = await validateLinkIds({
      rpgId,
      classIds: parsed.data.classIds ?? [],
      raceIds: parsed.data.raceIds ?? [],
    })

    if (!validatedLinks.ok) {
      return NextResponse.json({ message: validatedLinks.message }, { status: 400 })
    }

    const slug = buildSkillSlug(parsed.data.name)
    const rpgScope = createRpgScope(rpgId)
    const level1 = parsed.data.level1
    if ((parsed.data.currentLevel ?? 1) > 1) {
      return NextResponse.json(
        { message: "currentLevel inicial nao pode ser maior que 1 na criacao." },
        { status: 400 },
      )
    }

    const createdSkillId = crypto.randomUUID()
    const createdLevelId = crypto.randomUUID()

    await prisma.$transaction(async (tx) => {
      try {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO skills (
            id,
            owner_id,
            rpg_id,
            rpg_scope,
            name,
            slug,
            category,
            type,
            action_type,
            tags,
            description,
            current_level
          )
          VALUES (
            ${createdSkillId},
            ${userId},
            ${rpgId},
            ${rpgScope},
            ${parsed.data.name},
            ${slug},
            ${parsed.data.category},
            ${parsed.data.type},
            ${parsed.data.actionType},
            ${parsed.data.tags},
            ${parsed.data.description},
            ${parsed.data.currentLevel ?? 1}
          )
        `)
      } catch (error) {
        if (
          !(error instanceof Error) ||
          (!error.message.includes('column "action_type" does not exist') &&
            !error.message.includes('column "tags" does not exist'))
        ) {
          throw error
        }

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO skills (
            id,
            owner_id,
            rpg_id,
            rpg_scope,
            name,
            slug,
            category,
            type,
            description,
            current_level
          )
          VALUES (
            ${createdSkillId},
            ${userId},
            ${rpgId},
            ${rpgScope},
            ${parsed.data.name},
            ${slug},
            ${parsed.data.category},
            ${parsed.data.type},
            ${parsed.data.description},
            ${parsed.data.currentLevel ?? 1}
          )
        `)
      }

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
          ${createdLevelId},
          ${createdSkillId},
          1,
          ${level1.levelRequired ?? 1},
          ${level1.summary ?? null},
          ${level1.stats ? Prisma.sql`${JSON.stringify(level1.stats)}::jsonb` : Prisma.sql`NULL`},
          ${level1.cost ? Prisma.sql`${JSON.stringify(level1.cost)}::jsonb` : Prisma.sql`NULL`},
          ${level1.target ? Prisma.sql`${JSON.stringify(level1.target)}::jsonb` : Prisma.sql`NULL`},
          ${level1.area ? Prisma.sql`${JSON.stringify(level1.area)}::jsonb` : Prisma.sql`NULL`},
          ${level1.scaling ? Prisma.sql`${JSON.stringify(level1.scaling)}::jsonb` : Prisma.sql`NULL`},
          ${level1.requirement
            ? Prisma.sql`${JSON.stringify(level1.requirement)}::jsonb`
            : Prisma.sql`NULL`},
          ${JSON.stringify(level1.effects ?? [])}::jsonb
        )
      `)

      if ((parsed.data.classIds ?? []).length > 0) {
        const values = (parsed.data.classIds ?? []).map((classId) =>
          Prisma.sql`(${createdSkillId}, ${classId})`,
        )
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO skill_class_links (skill_id, class_template_id)
          VALUES ${Prisma.join(values)}
        `)
      }

      if ((parsed.data.raceIds ?? []).length > 0) {
        const values = (parsed.data.raceIds ?? []).map((raceId) =>
          Prisma.sql`(${createdSkillId}, ${raceId})`,
        )
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO skill_race_links (skill_id, race_template_id)
          VALUES ${Prisma.join(values)}
        `)
      }
    })

    const created = await fetchSkillById(createdSkillId, userId)

    return NextResponse.json({ skill: created }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("skills_owner_id_rpg_scope_slug_key")) {
        return NextResponse.json(
          { message: "Slug ja utilizado neste escopo (owner + rpg)." },
          { status: 409 },
        )
      }

      if (error.message.includes('relation "skills" does not exist')) {
        return NextResponse.json(
          { message: "Tabela skills nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ message: "Erro interno ao criar skill." }, { status: 500 })
  }
}
