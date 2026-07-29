import { Prisma } from "../../../../../../generated/prisma/client.js"
import type {
  MarkerSectionLinkMarker,
  MarkerSectionLinkRepository,
} from "@/features/world/location/application/ports/MarkerSectionLinkRepository"
import { prisma } from "@/lib/prisma"

const MARKER_ID_FIELD = "MarcadorId"
const MARKER_GROUP_ID_FIELD = "MarcadorGrupoId"
const MARKER_NAME_FIELD = "MarcadorNome"
const LOCATION_FIELD = "Localizacao"
const IMAGE_FIELD = "Imagem"
const COLOR_FIELD = "Cor"

type SectionLinkRow = {
  id: string
  description: string | null
  customFields: Prisma.JsonValue | null
}

type PublicMarkerRow = Omit<MarkerSectionLinkMarker, "visibility">

function toObject(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Prisma.JsonObject) }
    : {}
}

function jsonb(value: Record<string, unknown>) {
  return Prisma.sql`${JSON.stringify(value)}::jsonb`
}

function applyMarker(
  customFields: Prisma.JsonValue | null,
  marker: MarkerSectionLinkMarker,
) {
  const next = toObject(customFields)
  delete next[MARKER_ID_FIELD]
  delete next[MARKER_GROUP_ID_FIELD]
  delete next[MARKER_NAME_FIELD]

  next[MARKER_ID_FIELD] = marker.id
  next[MARKER_GROUP_ID_FIELD] = marker.groupId
  next[MARKER_NAME_FIELD] = marker.name

  for (const [field, value] of [
    [LOCATION_FIELD, marker.location],
    [IMAGE_FIELD, marker.image],
    [COLOR_FIELD, marker.color],
  ] as const) {
    if (value) next[field] = value
    else delete next[field]
  }

  return next
}

export const prismaMarkerSectionLinkRepository: MarkerSectionLinkRepository = {
  async setLink(params) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw(Prisma.sql`
        SELECT pg_advisory_xact_lock(
          hashtext(${`${params.rpgId}:${params.mapId}:${params.marker.id}`})
        )
      `)

      let marker = params.marker
      if (params.sectionId && params.marker.visibility === "public") {
        const markerRows = await tx.$queryRaw<PublicMarkerRow[]>(Prisma.sql`
          SELECT
            marker.id,
            marker.group_id AS "groupId",
            marker.name,
            marker.location,
            marker.short_description AS "shortDescription",
            marker.image,
            COALESCE(NULLIF(marker.color, ''), marker_group.color) AS color
          FROM rpg_map_markers marker
          INNER JOIN rpg_map_marker_groups marker_group
            ON marker_group.id = marker.group_id
          WHERE marker.rpg_id = ${params.rpgId}
            AND marker.map_id = ${params.mapId}
            AND marker.id = ${params.marker.id}
          LIMIT 1
        `)
        const publicMarker = markerRows[0]
        if (!publicMarker) return { status: "marker_not_found" }
        marker = { ...publicMarker, visibility: "public" }
      }

      let targetSection: SectionLinkRow | null = null
      if (params.sectionId) {
        const sectionRows = await tx.$queryRaw<SectionLinkRow[]>(Prisma.sql`
          SELECT
            id,
            description,
            custom_fields AS "customFields"
          FROM rpg_map_sections
          WHERE rpg_id = ${params.rpgId}
            AND map_id = ${params.mapId}
            AND id = ${params.sectionId}
          LIMIT 1
          FOR UPDATE
        `)
        targetSection = sectionRows[0] ?? null
        if (!targetSection) return { status: "section_not_found" }
      }

      await tx.$executeRaw(Prisma.sql`
        UPDATE rpg_map_sections
        SET
          custom_fields = NULLIF(
            custom_fields
              - ${MARKER_ID_FIELD}
              - ${MARKER_GROUP_ID_FIELD}
              - ${MARKER_NAME_FIELD},
            '{}'::jsonb
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE rpg_id = ${params.rpgId}
          AND map_id = ${params.mapId}
          AND custom_fields ->> ${MARKER_ID_FIELD} = ${params.marker.id}
      `)

      if (!targetSection || !params.sectionId) {
        return { status: "unlinked", sectionId: null }
      }

      const customFields = applyMarker(targetSection.customFields, marker)
      await tx.$executeRaw(Prisma.sql`
        UPDATE rpg_map_sections
        SET
          name = ${marker.name},
          description = ${marker.shortDescription ?? targetSection.description},
          custom_fields = ${jsonb(customFields)},
          updated_at = CURRENT_TIMESTAMP
        WHERE rpg_id = ${params.rpgId}
          AND map_id = ${params.mapId}
          AND id = ${params.sectionId}
      `)

      return { status: "linked", sectionId: params.sectionId }
    })
  },
}
