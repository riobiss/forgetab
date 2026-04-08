import { Prisma } from "../../../../../generated/prisma/client.js"
import type {
  JsonMapValue,
  RpgMapDto,
  RpgMapMarkerDto,
  RpgMapMarkerGroupDto,
  RpgMapSectionDto,
} from "@/application/rpg/map/types"
import type {
  MapRow,
  MarkerGroupRow,
  MarkerRow,
  SectionRow,
} from "@/infrastructure/rpg/map/repositories/rpgMapRepositoryRows"

function toIsoString(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return value
  return ""
}

function parseObject(value: Prisma.JsonValue | null | undefined): JsonMapValue {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {}
  }
  return value as JsonMapValue
}

export function mapMap(row: MapRow): RpgMapDto {
  return {
    id: row.id,
    rpgId: row.rpgId,
    createdByUserId: row.createdByUserId,
    title: row.title,
    description: row.description,
    type: row.type,
    image: row.image,
    order: row.order,
    sectionsCount: row.sectionsCount,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }
}

export function mapSection(row: SectionRow): RpgMapSectionDto {
  return {
    id: row.id,
    mapId: row.mapId,
    rpgId: row.rpgId,
    parentSectionId: row.parentSectionId,
    createdByUserId: row.createdByUserId,
    name: row.name,
    description: row.description,
    type: row.type,
    order: row.order,
    customFields: row.customFields ? parseObject(row.customFields) : null,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }
}

export function mapMarker(row: MarkerRow): RpgMapMarkerDto {
  return {
    id: row.id,
    groupId: row.groupId,
    mapId: row.mapId,
    rpgId: row.rpgId,
    createdByUserId: row.createdByUserId,
    name: row.name,
    location: row.location,
    shortDescription: row.shortDescription,
    image: row.image,
    color: row.color,
    x: row.x,
    y: row.y,
    size: row.size,
    pinStyle: row.pinStyle,
    order: row.order,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }
}

export function mapMarkerGroup(
  row: MarkerGroupRow,
  markers: MarkerRow[],
): RpgMapMarkerGroupDto {
  return {
    id: row.id,
    mapId: row.mapId,
    rpgId: row.rpgId,
    createdByUserId: row.createdByUserId,
    name: row.name,
    color: row.color,
    order: row.order,
    markers: markers.filter((marker) => marker.groupId === row.id).map(mapMarker),
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }
}
