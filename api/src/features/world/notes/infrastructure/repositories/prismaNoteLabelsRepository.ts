import { Prisma } from "../../../../../../generated/prisma/client.js"
import type { NoteLabelsRepository } from "@/features/world/notes/application/ports/NoteLabelsRepository"
import type { NoteLabel } from "@/features/world/notes/domain/Note"
import { prisma } from "@/features/shared/infrastructure/database/prisma"

export const prismaNoteLabelsRepository: NoteLabelsRepository = {
  async listLabels(rpgId, userId) {
    return prisma.$queryRaw<NoteLabel[]>(Prisma.sql`
      SELECT id, name
      FROM rpg_note_labels
      WHERE rpg_id = ${rpgId} AND user_id = ${userId}
      ORDER BY name ASC
    `)
  },

  async createLabel(rpgId, userId, name) {
    const rows = await prisma.$queryRaw<NoteLabel[]>(Prisma.sql`
      INSERT INTO rpg_note_labels (id, rpg_id, user_id, name)
      SELECT ${crypto.randomUUID()}, ${rpgId}, ${userId}, ${name}
      WHERE NOT EXISTS (
        SELECT 1 FROM rpg_note_labels
        WHERE rpg_id = ${rpgId} AND user_id = ${userId} AND LOWER(name) = LOWER(${name})
      )
      RETURNING id, name
    `)
    return rows[0] ?? null
  },

  async updateLabel(rpgId, userId, labelId, name) {
    const rows = await prisma.$queryRaw<NoteLabel[]>(Prisma.sql`
      UPDATE rpg_note_labels target
      SET name = ${name}, updated_at = CURRENT_TIMESTAMP
      WHERE target.id = ${labelId}
        AND target.rpg_id = ${rpgId}
        AND target.user_id = ${userId}
        AND NOT EXISTS (
          SELECT 1 FROM rpg_note_labels other
          WHERE other.rpg_id = ${rpgId}
            AND other.user_id = ${userId}
            AND other.id <> ${labelId}
            AND LOWER(other.name) = LOWER(${name})
        )
      RETURNING id, name
    `)
    return rows[0] ?? null
  },

  async deleteLabel(rpgId, userId, labelId) {
    const deleted = await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_note_labels
      WHERE id = ${labelId} AND rpg_id = ${rpgId} AND user_id = ${userId}
    `)
    return Boolean(deleted)
  }
}
