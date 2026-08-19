import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/features/shared/infrastructure/database/prisma"
import type { NotesRepository } from "@/features/world/notes/application/ports/NotesRepository"
import type { Note } from "@/features/world/notes/domain/Note"

type NoteRow = Omit<Note, "labels"> & { labels: unknown }

const noteColumns = Prisma.sql`
  n.id,
  n.rpg_id AS "rpgId",
  n.user_id AS "userId",
  n.client_id AS "clientId",
  n.title,
  n.content,
  n.revision,
  n.created_at AS "createdAt",
  n.updated_at AS "updatedAt",
  COALESCE(
    (
      SELECT json_agg(json_build_object('id', l.id, 'name', l.name) ORDER BY l.name)
      FROM rpg_note_label_assignments a
      JOIN rpg_note_labels l ON l.id = a.label_id
      WHERE a.note_id = n.id
    ),
    '[]'::json
  ) AS labels
`

function mapNote(row: NoteRow): Note {
  return {
    ...row,
    labels: Array.isArray(row.labels)
      ? row.labels.flatMap((value) => {
          if (!value || typeof value !== "object") return []
          const label = value as Record<string, unknown>
          return typeof label.id === "string" && typeof label.name === "string"
            ? [{ id: label.id, name: label.name }]
            : []
        })
      : []
  }
}

async function findNote(
  client: Prisma.TransactionClient,
  rpgId: string,
  userId: string,
  noteId: string
) {
  const rows = await client.$queryRaw<NoteRow[]>(Prisma.sql`
    SELECT ${noteColumns}
    FROM rpg_notes n
    WHERE n.id = ${noteId}
      AND n.rpg_id = ${rpgId}
      AND n.user_id = ${userId}
    LIMIT 1
  `)
  return rows[0] ? mapNote(rows[0]) : null
}

async function replaceLabels(
  client: Prisma.TransactionClient,
  noteId: string,
  rpgId: string,
  userId: string,
  labelIds: string[]
) {
  await client.$executeRaw(Prisma.sql`
    DELETE FROM rpg_note_label_assignments WHERE note_id = ${noteId}
  `)
  if (labelIds.length === 0) return
  await client.$executeRaw(Prisma.sql`
    INSERT INTO rpg_note_label_assignments (note_id, label_id)
    SELECT ${noteId}, id
    FROM rpg_note_labels
    WHERE id IN (${Prisma.join(labelIds)})
      AND rpg_id = ${rpgId}
      AND user_id = ${userId}
    ON CONFLICT DO NOTHING
  `)
}

export const prismaNotesRepository: NotesRepository = {
  async list(rpgId, userId, options) {
    const cursorClause = options.cursor
      ? Prisma.sql`
          AND (
            n.updated_at < ${options.cursor.updatedAt}
            OR (
              n.updated_at = ${options.cursor.updatedAt}
              AND n.id < ${options.cursor.id}
            )
          )
        `
      : Prisma.empty
    const labelClause = options.labelId
      ? Prisma.sql`
          AND EXISTS (
            SELECT 1
            FROM rpg_note_label_assignments filter_assignment
            WHERE filter_assignment.note_id = n.id
              AND filter_assignment.label_id = ${options.labelId}
          )
        `
      : Prisma.empty
    const rows = await prisma.$queryRaw<NoteRow[]>(Prisma.sql`
      SELECT ${noteColumns}
      FROM rpg_notes n
      WHERE n.rpg_id = ${rpgId}
        AND n.user_id = ${userId}
        ${cursorClause}
        ${labelClause}
      ORDER BY n.updated_at DESC, n.id DESC
      LIMIT ${options.limit}
    `)
    return rows.map(mapNote)
  },

  create(rpgId, userId, input) {
    return prisma.$transaction(async (transaction) => {
      const noteId = crypto.randomUUID()
      const inserted = await transaction.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          INSERT INTO rpg_notes (id, rpg_id, user_id, client_id, title, content)
          VALUES (
            ${noteId},
            ${rpgId},
            ${userId},
            ${input.clientId},
            ${input.title},
            ${input.content}
          )
          ON CONFLICT (rpg_id, user_id, client_id) DO NOTHING
          RETURNING id
        `
      )
      const persistedId = inserted[0]?.id
      if (!persistedId && input.clientId) {
        const existing = await transaction.$queryRaw<NoteRow[]>(Prisma.sql`
          SELECT ${noteColumns}
          FROM rpg_notes n
          WHERE n.rpg_id = ${rpgId}
            AND n.user_id = ${userId}
            AND n.client_id = ${input.clientId}
          LIMIT 1
        `)
        if (existing[0]) return mapNote(existing[0])
      }
      if (!persistedId) throw new Error("Nao foi possivel criar a nota.")
      await replaceLabels(
        transaction,
        persistedId,
        rpgId,
        userId,
        input.labelIds
      )
      const note = await findNote(transaction, rpgId, userId, persistedId)
      if (!note) throw new Error("Nota criada nao encontrada.")
      return note
    })
  },

  update(rpgId, userId, noteId, input) {
    return prisma.$transaction(async (transaction) => {
      const updated = await transaction.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          UPDATE rpg_notes
          SET
            title = ${input.title},
            content = ${input.content},
            revision = revision + 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${noteId}
            AND rpg_id = ${rpgId}
            AND user_id = ${userId}
            AND (
              ${input.baseRevision}::integer IS NULL
              OR revision = ${input.baseRevision}
            )
          RETURNING id
        `
      )
      if (!updated[0]) {
        const current = await findNote(transaction, rpgId, userId, noteId)
        return current
          ? { kind: "conflict" as const, note: current }
          : { kind: "not_found" as const }
      }
      await replaceLabels(transaction, noteId, rpgId, userId, input.labelIds)
      const note = await findNote(transaction, rpgId, userId, noteId)
      return note
        ? { kind: "updated" as const, note }
        : { kind: "not_found" as const }
    })
  },

  async delete(rpgId, userId, noteId) {
    const deleted = await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_notes
      WHERE id = ${noteId} AND rpg_id = ${rpgId} AND user_id = ${userId}
    `)
    return Boolean(deleted)
  }
}
