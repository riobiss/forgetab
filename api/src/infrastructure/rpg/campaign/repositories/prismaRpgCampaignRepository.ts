import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { RpgCampaignRepository } from "@/application/rpg/campaign/ports/RpgCampaignRepository"
import { parseCharacterAbilities } from "@/infrastructure/characters/abilities/services/characterAbilityCostParser"

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

function isLegacyCampaignCombatsSchemaError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('relation "rpg_campaign_combats" does not exist') ||
    error.message.includes('relation "rpg_campaign_combat_participants" does not exist') ||
    error.message.includes('relation "rpg_campaign_combat_queue_entries" does not exist') ||
    error.message.includes('column "source_character_id" does not exist') ||
    error.message.includes('column "actor_type" does not exist') ||
    error.message.includes('column "label" does not exist') ||
    error.message.includes('column "items" does not exist') ||
    error.message.includes('column "roll_config" does not exist') ||
    error.message.includes('column "stat_rolls" does not exist') ||
    error.message.includes('column "participant_id" does not exist')
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
        endedAt: Date | null
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
        c.ended_at AS "endedAt",
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
        endedAt: Date | null
      }>
    >(Prisma.sql`
      SELECT
        id,
        title,
        description,
        is_active AS "isActive",
        started_at AS "startedAt",
        ended_at AS "endedAt"
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
          ended_at = NULL,
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
        ended_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${campaignId}
        AND rpg_id = ${rpgId}
        AND is_active = true
      RETURNING id
    `)

    return rows.length > 0
  },

  async deleteCampaign(rpgId, campaignId) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM rpg_campaigns
      WHERE id = ${campaignId}
        AND rpg_id = ${rpgId}
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

  async listCampaignCombats(campaignId) {
    try {
      const combatRows = await prisma.$queryRaw<
        Array<{
          id: string
          name: string
          activeTurnIndex: number
          createdAt: Date
        }>
      >(Prisma.sql`
        SELECT
          id,
          name,
          active_turn_index AS "activeTurnIndex",
          created_at AS "createdAt"
        FROM rpg_campaign_combats
        WHERE campaign_id = ${campaignId}
        ORDER BY created_at ASC
      `)

      if (combatRows.length === 0) {
        return []
      }

      const participantRows = await prisma.$queryRaw<
        Array<{
          combatId: string
          id: string
          userId: string | null
          name: string
          characterId: string | null
          characterName: string | null
          sourceCharacterId: string | null
          actorType: "player" | "creature"
          role: "spectator" | "fighter"
          items: unknown
          rollConfig: unknown
          statRolls: unknown
          joinedAt: Date
        }>
      >(Prisma.sql`
        SELECT
          p.combat_id AS "combatId",
          p.id,
          u.id AS "userId",
          COALESCE(p.label, u.name, source_ch.name) AS name,
          p.character_id AS "characterId",
          ch.name AS "characterName",
          p.source_character_id AS "sourceCharacterId",
          p.actor_type AS "actorType",
          p.role,
          p.items,
          p.roll_config AS "rollConfig",
          p.stat_rolls AS "statRolls",
          p.joined_at AS "joinedAt"
        FROM rpg_campaign_combat_participants p
        INNER JOIN rpg_campaign_combats c ON c.id = p.combat_id
        LEFT JOIN users u ON u.id = p.user_id
        LEFT JOIN rpg_characters ch ON ch.id = p.character_id
        LEFT JOIN rpg_characters source_ch ON source_ch.id = p.source_character_id
        WHERE c.campaign_id = ${campaignId}
        ORDER BY p.joined_at ASC, u.name ASC
      `)

      const queueRows = await prisma.$queryRaw<
        Array<{
          combatId: string
          id: string
          participantId: string
          userId: string | null
          label: string
          roll: number
          position: number
        }>
      >(Prisma.sql`
        SELECT
          q.combat_id AS "combatId",
          q.id,
          q.participant_id AS "participantId",
          q.user_id AS "userId",
          q.label,
          q.roll,
          q.position
        FROM rpg_campaign_combat_queue_entries q
        INNER JOIN rpg_campaign_combats c ON c.id = q.combat_id
        WHERE c.campaign_id = ${campaignId}
        ORDER BY q.position ASC
      `)

      return combatRows.map((combat) => ({
        ...combat,
        participants: participantRows
          .filter((participant) => participant.combatId === combat.id)
          .map((participant) => ({
            id: participant.id,
            userId: participant.userId,
            name: participant.name,
            characterId: participant.characterId,
            characterName: participant.characterName,
            sourceCharacterId: participant.sourceCharacterId,
            actorType: participant.actorType,
            role: participant.role,
            items: participant.items,
            rollConfig: participant.rollConfig,
            statRolls: participant.statRolls,
            joinedAt: participant.joinedAt,
          })),
        queue: queueRows
          .filter((entry) => entry.combatId === combat.id)
          .map((entry) => ({
            id: entry.id,
            participantId: entry.participantId,
            userId: entry.userId,
            label: entry.label,
            roll: entry.roll,
            position: entry.position,
          })),
      }))
    } catch (error) {
      if (!isLegacyCampaignCombatsSchemaError(error)) {
        throw error
      }

      return []
    }
  },

  async getCampaignActionMessage(campaignId, messageId) {
    const rows = await prisma
      .$queryRaw<
        Array<{
          id: string
          authorId: string
          authorIsOwner: boolean
          content: string
        }>
      >(Prisma.sql`
        SELECT
          m.id,
          m.user_id AS "authorId",
          (r.owner_id = m.user_id) AS "authorIsOwner",
          m.content
        FROM rpg_campaign_messages m
        INNER JOIN rpg_campaigns c ON c.id = m.campaign_id
        INNER JOIN rpgs r ON r.id = c.rpg_id
        WHERE m.id = ${messageId}
          AND m.campaign_id = ${campaignId}
          AND m.kind = 'action'::"public"."RpgCampaignMessageKind"
        LIMIT 1
      `)
      .catch((error) => {
        if (!isLegacyCampaignMessagesSchemaError(error)) {
          throw error
        }

        return []
      })

    return rows[0] ?? null
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

  async deleteCampaignActionMessage(params) {
    const rows = await prisma
      .$queryRaw<Array<{ id: string }>>(Prisma.sql`
        DELETE FROM rpg_campaign_messages
        WHERE id = ${params.messageId}
          AND campaign_id = ${params.campaignId}
          AND kind = 'action'::"public"."RpgCampaignMessageKind"
          AND (
            ${params.canDeleteAny}
            OR (
              user_id = ${params.userId}
              AND id IN (
                SELECT id
                FROM rpg_campaign_messages
                WHERE campaign_id = ${params.campaignId}
                  AND kind = 'action'::"public"."RpgCampaignMessageKind"
                ORDER BY created_at DESC
                LIMIT 2
              )
            )
          )
        RETURNING id
      `)
      .catch((error) => {
        if (!isLegacyCampaignMessagesSchemaError(error)) {
          throw error
        }

        return []
      })

    return rows.length > 0
  },

  async createCombatRoom(params) {
    const id = crypto.randomUUID()
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_campaign_combats (id, campaign_id, created_by_user_id, name)
      VALUES (${id}, ${params.campaignId}, ${params.userId}, ${params.name})
    `)

    return { id }
  },

  async getCombatRoom(campaignId, combatId) {
    const rooms = await this.listCampaignCombats(campaignId)
    return rooms.find((room) => room.id === combatId) ?? null
  },

  async joinCombatRoom(params) {
    const rows = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM rpg_campaign_combat_participants
        WHERE combat_id = ${params.combatId}
          AND user_id = ${params.userId}
          AND actor_type = 'player'
      `)

      const inserted = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        INSERT INTO rpg_campaign_combat_participants (id, combat_id, user_id, character_id, actor_type, label, role)
        SELECT
          ${crypto.randomUUID()},
          c.id,
          ${params.userId},
          CASE
            WHEN ${params.characterId}::text IS NULL THEN NULL
            ELSE (
              SELECT ch.id
              FROM rpg_characters ch
              INNER JOIN rpg_campaigns campaign ON campaign.rpg_id = ch.rpg_id
              WHERE ch.id = ${params.characterId}
                AND campaign.id = ${params.campaignId}
                AND ch.created_by_user_id = ${params.userId}
              LIMIT 1
            )
          END,
          'player',
          NULL,
          ${params.role}
        FROM rpg_campaign_combats c
        WHERE c.id = ${params.combatId}
          AND c.campaign_id = ${params.campaignId}
        RETURNING id
      `)

      if (params.role === "spectator") {
        await tx.$executeRaw(Prisma.sql`
          DELETE FROM rpg_campaign_combat_queue_entries
          WHERE combat_id = ${params.combatId}
            AND user_id = ${params.userId}
        `)

        await tx.$executeRaw(Prisma.sql`
          UPDATE rpg_campaign_combats
          SET
            active_turn_index = LEAST(
              active_turn_index,
              GREATEST(
                (SELECT COUNT(*)::int - 1 FROM rpg_campaign_combat_queue_entries WHERE combat_id = ${params.combatId}),
                0
              )
            ),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${params.combatId}
            AND campaign_id = ${params.campaignId}
        `)
      }

      return inserted
    })

    return rows.length > 0
  },

  async addCreatureCombatants(params) {
    const creatureRows = await prisma.$queryRaw<Array<{ id: string; name: string }>>(Prisma.sql`
      SELECT ch.id, ch.name
      FROM rpg_characters ch
      INNER JOIN rpg_campaigns c ON c.rpg_id = ch.rpg_id
      WHERE c.id = ${params.campaignId}
        AND ch.id = ${params.sourceCharacterId}
        AND ch.character_type = 'creature'::"public"."RpgCharacterType"
      LIMIT 1
    `)

    const creature = creatureRows[0]
    if (!creature) {
      return false
    }

    const combatRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM rpg_campaign_combats
      WHERE id = ${params.combatId}
        AND campaign_id = ${params.campaignId}
      LIMIT 1
    `)

    if (combatRows.length === 0) {
      return false
    }

    const currentCountRows = await prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM rpg_campaign_combat_participants
      WHERE combat_id = ${params.combatId}
        AND source_character_id = ${params.sourceCharacterId}
    `)
    const currentCount = currentCountRows[0]?.count ?? 0
    const entries = Array.from({ length: params.quantity }, (_, index) => ({
      id: crypto.randomUUID(),
      label: `${creature.name} ${currentCount + index + 1}`,
    }))

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_campaign_combat_participants (
        id,
        combat_id,
        user_id,
        character_id,
        source_character_id,
        actor_type,
        label,
        role,
        items,
        roll_config,
        stat_rolls
      )
      VALUES ${Prisma.join(
        entries.map((entry) =>
          Prisma.sql`(
            ${entry.id},
            ${params.combatId},
            NULL,
            NULL,
            ${params.sourceCharacterId},
            'creature',
            ${entry.label},
            'fighter',
            ${JSON.stringify(params.items ?? null)}::jsonb,
            ${JSON.stringify(params.rollConfig ?? null)}::jsonb,
            ${JSON.stringify(params.statRolls ?? null)}::jsonb
          )`,
        ),
      )}
    `)

    return true
  },

  async createCombatQueue(campaignId, combatId) {
    const fighters = await prisma.$queryRaw<
      Array<{
        participantId: string
        userId: string | null
        label: string
      }>
    >(Prisma.sql`
      SELECT
        p.id AS "participantId",
        p.user_id AS "userId",
        COALESCE(p.label, ch.name, source_ch.name, u.name) AS label
      FROM rpg_campaign_combat_participants p
      INNER JOIN rpg_campaign_combats c ON c.id = p.combat_id
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN rpg_characters ch ON ch.id = p.character_id
      LEFT JOIN rpg_characters source_ch ON source_ch.id = p.source_character_id
      WHERE p.combat_id = ${combatId}
        AND c.campaign_id = ${campaignId}
        AND p.role = 'fighter'
      ORDER BY p.joined_at ASC, label ASC
    `)

    if (fighters.length === 0) {
      return false
    }

    const entries = fighters
      .map((fighter) => ({
        ...fighter,
        id: crypto.randomUUID(),
        roll: Math.floor(Math.random() * 20) + 1,
      }))
      .sort((left, right) => right.roll - left.roll || left.label.localeCompare(right.label))

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM rpg_campaign_combat_queue_entries
        WHERE combat_id = ${combatId}
      `)

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO rpg_campaign_combat_queue_entries (id, combat_id, participant_id, user_id, label, roll, position)
        VALUES ${Prisma.join(
          entries.map((entry, index) =>
            Prisma.sql`(${entry.id}, ${combatId}, ${entry.participantId}, ${entry.userId}, ${entry.label}, ${entry.roll}, ${index})`,
          ),
        )}
      `)

      await tx.$executeRaw(Prisma.sql`
        UPDATE rpg_campaign_combats
        SET active_turn_index = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${combatId}
          AND campaign_id = ${campaignId}
      `)
    })

    return true
  },

  async moveCombatQueueEntry(params) {
    const queue = await prisma.$queryRaw<Array<{ id: string; position: number }>>(Prisma.sql`
      SELECT q.id, q.position
      FROM rpg_campaign_combat_queue_entries q
      INNER JOIN rpg_campaign_combats c ON c.id = q.combat_id
      WHERE q.combat_id = ${params.combatId}
        AND c.campaign_id = ${params.campaignId}
      ORDER BY q.position ASC
    `)

    const currentIndex = queue.findIndex((entry) => entry.id === params.entryId)
    const nextIndex = currentIndex + params.direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= queue.length) {
      return false
    }

    const currentEntry = queue[currentIndex]
    const nextEntry = queue[nextIndex]
    if (!currentEntry || !nextEntry) {
      return false
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE rpg_campaign_combat_queue_entries
        SET position = CASE
          WHEN id = ${currentEntry.id} THEN ${nextEntry.position}
          WHEN id = ${nextEntry.id} THEN ${currentEntry.position}
          ELSE position
        END
        WHERE id IN (${currentEntry.id}, ${nextEntry.id})
      `)

      await tx.$executeRaw(Prisma.sql`
        UPDATE rpg_campaign_combats
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ${params.combatId}
          AND campaign_id = ${params.campaignId}
      `)
    })

    return true
  },

  async passCombatTurn(params) {
    const rows = await prisma.$queryRaw<
      Array<{
        activeTurnIndex: number
        queueCount: number
        currentUserId: string | null
      }>
    >(Prisma.sql`
      WITH ordered_queue AS (
        SELECT
          q.user_id,
          ROW_NUMBER() OVER (ORDER BY q.position ASC) - 1 AS queue_index
        FROM rpg_campaign_combat_queue_entries q
        WHERE q.combat_id = ${params.combatId}
      )
      SELECT
        c.active_turn_index AS "activeTurnIndex",
        (SELECT COUNT(*)::int FROM ordered_queue) AS "queueCount",
        (
          SELECT user_id
          FROM ordered_queue
          WHERE queue_index = c.active_turn_index
          LIMIT 1
        ) AS "currentUserId"
      FROM rpg_campaign_combats c
      WHERE c.id = ${params.combatId}
        AND c.campaign_id = ${params.campaignId}
      LIMIT 1
    `)

    const combat = rows[0]
    if (!combat || combat.queueCount <= 0) {
      return false
    }

    if (!params.canPassAny && combat.currentUserId !== params.userId) {
      return false
    }

    await prisma.$executeRaw(Prisma.sql`
      UPDATE rpg_campaign_combats
      SET
        active_turn_index = ${(combat.activeTurnIndex + 1) % combat.queueCount},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.combatId}
        AND campaign_id = ${params.campaignId}
    `)

    return true
  },

  async grantDeliveryAssets(params) {
    const result = await prisma.$transaction(async (tx) => {
      const characterRows = await tx.$queryRaw<
        Array<{
          id: string
          abilities: Prisma.JsonValue
        }>
      >(Prisma.sql`
        SELECT id, COALESCE(abilities, '[]'::jsonb) AS abilities
        FROM rpg_characters
        WHERE id = ${params.characterId}
          AND rpg_id = ${params.rpgId}
          AND created_by_user_id = ${params.userId}
          AND character_type = 'player'::"public"."RpgCharacterType"
        FOR UPDATE
      `)

      const character = characterRows[0]
      if (!character) {
        return "invalid" as const
      }

      let nextAbilities = parseCharacterAbilities(character.abilities)

      for (const asset of params.assets) {
        if (asset.kind === "item") {
          const itemRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT id
            FROM baseitems
            WHERE id = ${asset.id}
              AND rpg_id = ${params.rpgId}
            LIMIT 1
          `)
          if (!itemRows[0]) {
            return "invalid" as const
          }
          continue
        }

        const skillRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT sl.id
          FROM skill_levels sl
          INNER JOIN skills s ON s.id = sl.skill_id
          WHERE s.id = ${asset.id}
            AND s.rpg_id = ${params.rpgId}
            AND sl.level_number = ${asset.level}
          LIMIT 1
        `)
        if (!skillRows[0]) {
          return "invalid" as const
        }
      }

      if (params.markOfferOpened) {
        const openedRows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          UPDATE rpg_campaign_messages
          SET
            content = ${params.nextContent},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${params.messageId}
            AND campaign_id = ${params.campaignId}
            AND kind = 'action'::"public"."RpgCampaignMessageKind"
            AND content = ${params.previousContent}
          RETURNING id
        `)

        if (openedRows.length === 0) {
          return "already_opened" as const
        }
      }

      for (const asset of params.assets) {
        if (asset.kind === "item") {
          await tx.$executeRaw(Prisma.sql`
            INSERT INTO rpg_character_inventory_items (
              id,
              rpg_id,
              character_id,
              base_item_id,
              quantity
            )
            VALUES (
              ${crypto.randomUUID()},
              ${params.rpgId},
              ${params.characterId},
              ${asset.id},
              ${asset.quantity}
            )
            ON CONFLICT (character_id, base_item_id)
            DO UPDATE SET
              quantity = rpg_character_inventory_items.quantity + EXCLUDED.quantity,
              updated_at = CURRENT_TIMESTAMP
          `)
          continue
        }

        if (nextAbilities.some((ability) => ability.skillId === asset.id && ability.level === asset.level)) {
          continue
        }

        nextAbilities = [
          ...nextAbilities.filter((ability) => ability.skillId !== asset.id),
          { skillId: asset.id, level: asset.level },
        ]
      }

      await tx.rpgCharacter.update({
        where: { id: params.characterId },
        data: {
          abilities: nextAbilities as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      })

      return "granted" as const
    })

    return result
  },
}
