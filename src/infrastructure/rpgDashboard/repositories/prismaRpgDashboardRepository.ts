import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { RpgDashboardRepository } from "@/application/rpgDashboard/ports/RpgDashboardRepository"

export const prismaRpgDashboardRepository: RpgDashboardRepository = {
  async getRpgById(rpgId) {
    let rows = [] as Awaited<ReturnType<RpgDashboardRepository["getRpgById"]>>[]

    try {
      rows = await prisma.$queryRaw(Prisma.sql`
        SELECT
          r.id,
          r.owner_id AS "ownerId",
          COALESCE(u.name, u.username, 'Mestre') AS "ownerName",
          r.title,
          r.description,
          r.visibility,
          COALESCE(r.use_mundi_map, false) AS "useMundiMap",
          COALESCE(r.users_can_manage_own_xp, true) AS "usersCanManageOwnXp",
          COALESCE(r.allow_skill_point_distribution, true) AS "allowSkillPointDistribution",
          r.created_at AS "createdAt"
        FROM rpgs r
        LEFT JOIN users u ON u.id = r.owner_id
        WHERE r.id = ${rpgId}
        LIMIT 1
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "use_mundi_map" does not exist') ||
          error.message.includes('column "users_can_manage_own_xp" does not exist') ||
          error.message.includes('column "allow_skill_point_distribution" does not exist'))
      ) {
        rows = await prisma.$queryRaw(Prisma.sql`
          SELECT
            r.id,
            r.owner_id AS "ownerId",
            COALESCE(u.name, u.username, 'Mestre') AS "ownerName",
            r.title,
            r.description,
            r.visibility,
            false AS "useMundiMap",
            true AS "usersCanManageOwnXp",
            true AS "allowSkillPointDistribution",
            r.created_at AS "createdAt"
          FROM rpgs r
          LEFT JOIN users u ON u.id = r.owner_id
          WHERE r.id = ${rpgId}
          LIMIT 1
        `)
      } else {
        throw error
      }
    }

    return rows[0] ?? null
  },

  listPendingRequests(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT
        m.id,
        u.username AS "userUsername",
        u.name AS "userName",
        m.requested_at AS "requestedAt"
      FROM rpg_members m
      INNER JOIN users u ON u.id = m.user_id
      WHERE m.rpg_id = ${rpgId}
        AND m.status = 'pending'::"public"."RpgMemberStatus"
      ORDER BY m.requested_at ASC
    `)
  },

  listPendingCharacterRequests(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT
        r.id,
        u.username AS "userUsername",
        u.name AS "userName",
        r.requested_at AS "requestedAt"
      FROM rpg_character_creation_requests r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.rpg_id = ${rpgId}
        AND r.status = 'pending'::"public"."CharacterCreationRequestStatus"
      ORDER BY r.requested_at ASC
    `)
  },

  listAcceptedMembers(rpgId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT
        m.id,
        m.user_id AS "userId",
        u.username AS "userUsername",
        u.name AS "userName",
        m.role::text AS role
      FROM rpg_members m
      INNER JOIN users u ON u.id = m.user_id
      WHERE m.rpg_id = ${rpgId}
        AND m.status = 'accepted'::"public"."RpgMemberStatus"
      ORDER BY u.name ASC
    `)
  },

  async countAcceptedMembers(rpgId) {
    const rows = await prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
      SELECT COUNT(*) AS total
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND status = 'accepted'::"public"."RpgMemberStatus"
    `)

    return Number(rows[0]?.total ?? 0)
  },

  async getTemplatesPresence(rpgId) {
    try {
      const [raceCount, classCount] = await Promise.all([
        prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
          SELECT COUNT(*) AS total
          FROM rpg_race_templates
          WHERE rpg_id = ${rpgId}
        `),
        prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
          SELECT COUNT(*) AS total
          FROM rpg_class_templates
          WHERE rpg_id = ${rpgId}
        `),
      ])

      return {
        hasRaces: Number(raceCount[0]?.total ?? 0) > 0,
        hasClasses: Number(classCount[0]?.total ?? 0) > 0,
      }
    } catch {
      return { hasRaces: false, hasClasses: false }
    }
  },

  async getSpectatorVisionData(rpgId) {
    const [charactersRows, attributeTemplateRows, skillTemplateRows, statusTemplateRows] =
      await Promise.all([
        prisma.$queryRaw(Prisma.sql`
          SELECT
            c.id,
            c.name,
            c.character_type AS "characterType",
            c.life,
            c.mana,
            c.sanity,
            c.stamina AS exhaustion,
            COALESCE(c.statuses, '{}'::jsonb) AS statuses,
            COALESCE(c.current_statuses, '{}'::jsonb) AS "currentStatuses",
            COALESCE(c.attributes, '{}'::jsonb) AS attributes,
            COALESCE(c.skills, '{}'::jsonb) AS skills
          FROM rpg_characters c
          WHERE c.rpg_id = ${rpgId}
          ORDER BY c.created_at DESC
        `),
        prisma.$queryRaw(Prisma.sql`
          SELECT key, label
          FROM rpg_attribute_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `),
        prisma.$queryRaw(Prisma.sql`
          SELECT key, label
          FROM rpg_skill_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `),
        prisma.$queryRaw(Prisma.sql`
          SELECT key, label
          FROM rpg_status_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `),
      ])

    return {
      charactersRows,
      attributeTemplateRows,
      skillTemplateRows,
      statusTemplateRows,
    }
  },
}

