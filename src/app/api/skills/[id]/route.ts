import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import {
  fetchSkillById,
  getUserIdFromRequest,
  validateLinkIds,
} from "@/lib/server/skillBuilder"
import { buildSkillSlug, skillMetaPatchSchema } from "@/lib/validators/skillBuilder"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
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

    return NextResponse.json({ skill }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "skills" does not exist')) {
      return NextResponse.json(
        { message: "Tabela skills nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao buscar skill." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { id } = await context.params
    const existing = await fetchSkillById(id, userId)
    if (!existing) {
      return NextResponse.json({ message: "Skill nao encontrada." }, { status: 404 })
    }

    const body = await request.json()
    const parsed = skillMetaPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const classIds = parsed.data.classIds ?? existing.classIds
    const raceIds = parsed.data.raceIds ?? existing.raceIds
    const validatedLinks = await validateLinkIds({
      rpgId: existing.rpgId,
      classIds,
      raceIds,
    })
    if (!validatedLinks.ok) {
      return NextResponse.json({ message: validatedLinks.message }, { status: 400 })
    }

    const nextTags = parsed.data.tags ?? existing.tags
    const nextSlug = buildSkillSlug(parsed.data.slug ?? existing.slug)

    await prisma.$transaction(async (tx) => {
      try {
        await tx.$executeRaw(Prisma.sql`
          UPDATE skills
          SET
            slug = ${nextSlug},
            tags = ${nextTags},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
            AND owner_id = ${userId}
        `)
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('column "tags" does not exist')) {
          throw error
        }

        await tx.$executeRaw(Prisma.sql`
          UPDATE skills
          SET
            slug = ${nextSlug},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id}
            AND owner_id = ${userId}
        `)
      }

      if (parsed.data.classIds !== undefined) {
        await tx.$executeRaw(Prisma.sql`
          DELETE FROM skill_class_links
          WHERE skill_id = ${id}
        `)

        if (parsed.data.classIds.length > 0) {
          const values = parsed.data.classIds.map((classId) => Prisma.sql`(${id}, ${classId})`)
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO skill_class_links (skill_id, class_template_id)
            VALUES ${Prisma.join(values)}
          `)
        }
      }

      if (parsed.data.raceIds !== undefined) {
        await tx.$executeRaw(Prisma.sql`
          DELETE FROM skill_race_links
          WHERE skill_id = ${id}
        `)

        if (parsed.data.raceIds.length > 0) {
          const values = parsed.data.raceIds.map((raceId) => Prisma.sql`(${id}, ${raceId})`)
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO skill_race_links (skill_id, race_template_id)
            VALUES ${Prisma.join(values)}
          `)
        }
      }
    })

    const updated = await fetchSkillById(id, userId)
    return NextResponse.json({ skill: updated }, { status: 200 })
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

    return NextResponse.json({ message: "Erro interno ao atualizar skill." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { id } = await context.params
    const existing = await fetchSkillById(id, userId)
    if (!existing) {
      return NextResponse.json({ message: "Skill nao encontrada." }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM skill_class_links
        WHERE skill_id = ${id}
      `)

      await tx.$executeRaw(Prisma.sql`
        DELETE FROM skill_race_links
        WHERE skill_id = ${id}
      `)

      await tx.$executeRaw(Prisma.sql`
        DELETE FROM skill_levels
        WHERE skill_id = ${id}
      `)

      await tx.$executeRaw(Prisma.sql`
        DELETE FROM skills
        WHERE id = ${id}
          AND owner_id = ${userId}
      `)
    })

    return NextResponse.json({ id }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "skills" does not exist')) {
      return NextResponse.json(
        { message: "Tabela skills nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao remover skill." }, { status: 500 })
  }
}

