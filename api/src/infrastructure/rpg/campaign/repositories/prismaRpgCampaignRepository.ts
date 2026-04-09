import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { RpgCampaignRepository } from "@/application/rpg/campaign/ports/RpgCampaignRepository"

function isLegacyCampaignMessagesSchemaError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('column "recipient_user_id" does not exist') ||
    error.message.includes('column "kind" does not exist') ||
    error.message.includes('type "public"."RpgCampaignMessageKind" does not exist')
  )
}

export const prismaRpgCampaignRepository: RpgCampaignRepository = {
  async listCampaigns(rpgId, userId) {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string
        title: string
        description: string
        isActive: boolean
        startedAt: Date | null
        createdAt: Date
        participantsCount: bigint | number
        hasJoined: boolean
      }>
    >(Prisma.sql`
      SELECT
        c.id,
        c.title,
        c.description,
        c.is_active AS "isActive",
        c.started_at AS "startedAt",
        c.created_at AS "createdAt",
        (
          SELECT COUNT(*)
          FROM rpg_campaign_participants p
          WHERE p.campaign_id = c.id
        ) AS "participantsCount",
        EXISTS(
          SELECT 1
          FROM rpg_campaign_participants p
          WHERE p.campaign_id = c.id
            AND p.user_id = ${userId}
        ) AS "hasJoined"
      FROM rpg_campaigns c
      WHERE c.rpg_id = ${rpgId}
      ORDER BY c.is_active DESC, c.created_at DESC
    `)

    return rows.map((row) => ({
      ...row,
      participantsCount: Number(row.participantsCount ?? 0),
    }))
  },

  async getCampaignSummary(rpgId, campaignId) {
    const rows = await prisma.$queryRaw<
      Array<{
        id: string
        title: string
        description: string
        isActive: boolean
        startedAt: Date | null
      }>
    >(Prisma.sql`
      SELECT
        id,
        title,
        description,
        is_active AS "isActive",
        started_at AS "startedAt"
      FROM rpg_campaigns
      WHERE id = ${campaignId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)

    return rows[0] ?? null
  },

  async createCampaign(rpgId, payload) {
    const id = crypto.randomUUID()
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_campaigns (id, rpg_id, title, description)
      VALUES (${id}, ${rpgId}, ${payload.title}, ${payload.description})
    `)
    return { id }
  },

  async startCampaign(rpgId, campaignId) {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE rpg_campaigns
        SET
          is_active = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE rpg_id = ${rpgId}
          AND is_active = true
      `)

      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE rpg_campaigns
        SET
          is_active = true,
          started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${campaignId}
          AND rpg_id = ${rpgId}
        RETURNING id
      `)

      return rows.length > 0
    })

    return result
  },

  async endCampaign(rpgId, campaignId) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE rpg_campaigns
      SET
        is_active = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${campaignId}
        AND rpg_id = ${rpgId}
        AND is_active = true
      RETURNING id
    `)

    return rows.length > 0
  },

  async joinCampaign(campaignId, userId) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO rpg_campaign_participants (id, campaign_id, user_id)
      VALUES (${crypto.randomUUID()}, ${campaignId}, ${userId})
      ON CONFLICT ("campaign_id", "user_id") DO NOTHING
      RETURNING id
    `)

    return rows.length > 0
  },

  async leaveCampaign(campaignId, userId) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM rpg_campaign_participants
      WHERE campaign_id = ${campaignId}
        AND user_id = ${userId}
      RETURNING id
    `)

    return rows.length > 0
  },

  async hasJoinedCampaign(campaignId, userId) {
    const rows = await prisma.$queryRaw<Array<{ joined: boolean }>>(Prisma.sql`
      SELECT EXISTS(
        SELECT 1
        FROM rpg_campaign_participants
        WHERE campaign_id = ${campaignId}
          AND user_id = ${userId}
      ) AS joined
    `)

    return Boolean(rows[0]?.joined)
  },

  async isParticipantInCampaign(campaignId, userId) {
    const rows = await prisma.$queryRaw<Array<{ joined: boolean }>>(Prisma.sql`
      SELECT EXISTS(
        SELECT 1
        FROM rpg_campaigns c
        LEFT JOIN rpgs r ON r.id = c.rpg_id
        LEFT JOIN rpg_campaign_participants p
          ON p.campaign_id = c.id
          AND p.user_id = ${userId}
        WHERE c.id = ${campaignId}
          AND (r.owner_id = ${userId} OR p.user_id IS NOT NULL)
      ) AS joined
    `)

    return Boolean(rows[0]?.joined)
  },

  listCampaignParticipants(campaignId) {
    return prisma.$queryRaw(Prisma.sql`
      SELECT *
      FROM (
        SELECT
          owner_user.id AS "userId",
          owner_user.username,
          owner_user.name,
          COALESCE(c.started_at, c.created_at) AS "joinedAt"
        FROM rpg_campaigns c
        INNER JOIN rpgs r ON r.id = c.rpg_id
        INNER JOIN users owner_user ON owner_user.id = r.owner_id
        WHERE c.id = ${campaignId}

        UNION

        SELECT
          u.id AS "userId",
          u.username,
          u.name,
          p.joined_at AS "joinedAt"
        FROM rpg_campaign_participants p
        INNER JOIN users u ON u.id = p.user_id
        WHERE p.campaign_id = ${campaignId}
      ) participants
      ORDER BY "joinedAt" ASC, name ASC
    `)
  },

  listCampaignMessages(campaignId) {
    return prisma
      .$queryRaw<Array<{
        id: string
        campaignId: string
        authorId: string
        authorUsername: string
        authorName: string
        recipientUserId: string | null
        kind: "campaign" | "direct" | "action"
        content: string
        createdAt: Date
      }>>(Prisma.sql`
        SELECT
          m.id,
          m.campaign_id AS "campaignId",
          u.id AS "authorId",
          u.username AS "authorUsername",
          u.name AS "authorName",
          m.recipient_user_id AS "recipientUserId",
          m.kind::text AS kind,
          m.content,
          m.created_at AS "createdAt"
        FROM rpg_campaign_messages m
        INNER JOIN users u ON u.id = m.user_id
        WHERE m.campaign_id = ${campaignId}
          AND m.kind <> 'direct'::"public"."RpgCampaignMessageKind"
        ORDER BY m.created_at ASC
      `)
      .catch((error) => {
        if (!isLegacyCampaignMessagesSchemaError(error)) {
          throw error
        }

        return prisma.$queryRaw<Array<{
          id: string
          campaignId: string
          authorId: string
          authorUsername: string
          authorName: string
          recipientUserId: string | null
          kind: "campaign"
          content: string
          createdAt: Date
        }>>(Prisma.sql`
          SELECT
            m.id,
            m.campaign_id AS "campaignId",
            u.id AS "authorId",
            u.username AS "authorUsername",
            u.name AS "authorName",
            NULL AS "recipientUserId",
            'campaign' AS kind,
            m.content,
            m.created_at AS "createdAt"
          FROM rpg_campaign_messages m
          INNER JOIN users u ON u.id = m.user_id
          WHERE m.campaign_id = ${campaignId}
          ORDER BY m.created_at ASC
        `)
      })
  },

  listDirectMessagesForUser(campaignId, userId) {
    return prisma
      .$queryRaw<Array<{
        id: string
        campaignId: string
        authorId: string
        authorUsername: string
        authorName: string
        recipientUserId: string | null
        kind: "direct"
        content: string
        createdAt: Date
      }>>(Prisma.sql`
        SELECT
          m.id,
          m.campaign_id AS "campaignId",
          u.id AS "authorId",
          u.username AS "authorUsername",
          u.name AS "authorName",
          m.recipient_user_id AS "recipientUserId",
          m.kind::text AS kind,
          m.content,
          m.created_at AS "createdAt"
        FROM rpg_campaign_messages m
        INNER JOIN users u ON u.id = m.user_id
        WHERE m.campaign_id = ${campaignId}
          AND m.kind = 'direct'::"public"."RpgCampaignMessageKind"
          AND (m.user_id = ${userId} OR m.recipient_user_id = ${userId})
        ORDER BY m.created_at ASC
      `)
      .catch((error) => {
        if (!isLegacyCampaignMessagesSchemaError(error)) {
          throw error
        }

        return []
      })
  },

  async createCampaignMessage(campaignId, userId, kind, content, recipientUserId = null) {
    try {
      const rows = await prisma.$queryRaw<
        Array<{
          id: string
          campaignId: string
          authorId: string
          authorUsername: string
          authorName: string
          recipientUserId: string | null
          kind: "campaign" | "direct" | "action"
          content: string
          createdAt: Date
        }>
      >(Prisma.sql`
        WITH inserted AS (
          INSERT INTO rpg_campaign_messages (id, campaign_id, user_id, recipient_user_id, kind, content)
          VALUES (${crypto.randomUUID()}, ${campaignId}, ${userId}, ${recipientUserId}, ${kind}::"public"."RpgCampaignMessageKind", ${content})
          RETURNING id, campaign_id, user_id, recipient_user_id, kind, content, created_at
        )
        SELECT
          i.id,
          i.campaign_id AS "campaignId",
          u.id AS "authorId",
          u.username AS "authorUsername",
          u.name AS "authorName",
          i.recipient_user_id AS "recipientUserId",
          i.kind::text AS kind,
          i.content,
          i.created_at AS "createdAt"
        FROM inserted i
        INNER JOIN users u ON u.id = i.user_id
        LIMIT 1
      `)

      return rows[0]
    } catch (error) {
      if (!isLegacyCampaignMessagesSchemaError(error)) {
        throw error
      }

      if (kind !== "campaign") {
        throw new Error("Schema de chat da campanha ainda nao suporta mensagens diretas ou de acao.")
      }

      const rows = await prisma.$queryRaw<
        Array<{
          id: string
          campaignId: string
          authorId: string
          authorUsername: string
          authorName: string
          recipientUserId: string | null
          kind: "campaign"
          content: string
          createdAt: Date
        }>
      >(Prisma.sql`
        WITH inserted AS (
          INSERT INTO rpg_campaign_messages (id, campaign_id, user_id, content)
          VALUES (${crypto.randomUUID()}, ${campaignId}, ${userId}, ${content})
          RETURNING id, campaign_id, user_id, content, created_at
        )
        SELECT
          i.id,
          i.campaign_id AS "campaignId",
          u.id AS "authorId",
          u.username AS "authorUsername",
          u.name AS "authorName",
          NULL AS "recipientUserId",
          'campaign' AS kind,
          i.content,
          i.created_at AS "createdAt"
        FROM inserted i
        INNER JOIN users u ON u.id = i.user_id
        LIMIT 1
      `)

      return rows[0]
    }
  },
}
