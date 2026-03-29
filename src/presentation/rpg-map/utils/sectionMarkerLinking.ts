"use client"

import {
  normalizeCustomFieldType,
  type CustomFieldType,
} from "@/components/custom-fields/typedCustomField"
import type {
  JsonMapValue,
  RpgMapDetailViewDto,
  RpgMapSectionDto,
} from "@/application/rpgMap/types"
import type { LinkedSectionSnapshot, MarkerPinStyle } from "@/presentation/rpg-map/types/mapMarkers"

export type MarkerLinkOption = {
  id: string
  groupId: string
  visibility: "private" | "public"
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  color: string | null
  size: number | null
  pinStyle: MarkerPinStyle | null
}

export type SectionSavePayload = {
  name: string
  description: string | null
  type: string | null
  parentSectionId: string | null
  customFields: JsonMapValue | null
}

type SerializedSectionCustomField = {
  value: string
  type: CustomFieldType
}

export const SECTION_LINK_MARKER_ID = "MarcadorId"
export const SECTION_LINK_MARKER_GROUP_ID = "MarcadorGrupoId"
export const SECTION_LINK_MARKER_NAME = "MarcadorNome"
export const SECTION_LINK_LOCATION = "Localizacao"
export const SECTION_LINK_IMAGE = "Imagem"
export const SECTION_LINK_COLOR = "Cor"
export const SECTION_IMAGES = "ImagensSecao"

export const RESERVED_SECTION_FIELD_NAMES = new Set([
  SECTION_LINK_MARKER_ID,
  SECTION_LINK_MARKER_GROUP_ID,
  SECTION_LINK_MARKER_NAME,
  SECTION_IMAGES,
])

const INTERNAL_SECTION_FIELD_NAMES = new Set([
  SECTION_LINK_MARKER_ID,
  SECTION_LINK_MARKER_GROUP_ID,
  SECTION_LINK_MARKER_NAME,
  SECTION_IMAGES,
])

export function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function getOptionalStringValue(value: unknown) {
  const normalized = getStringValue(value)
  return normalized.length > 0 ? normalized : null
}

export function getLinkedMarkerId(value: JsonMapValue | null | undefined) {
  const markerId = value?.[SECTION_LINK_MARKER_ID]
  return typeof markerId === "string" ? markerId : ""
}

export function getSectionImages(value: JsonMapValue | null | undefined) {
  const images = value?.[SECTION_IMAGES]
  if (!Array.isArray(images)) {
    return []
  }

  return images
    .map((image) => (typeof image === "string" ? image.trim() : ""))
    .filter((image) => image.length > 0)
    .slice(0, 5)
}

function parseSectionCustomFieldValue(value: unknown): SerializedSectionCustomField {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const valueRecord = value as Record<string, unknown>
    return {
      value: valueRecord.value == null ? "" : String(valueRecord.value),
      type: normalizeCustomFieldType(valueRecord.type),
    }
  }

  return {
    value: value == null ? "" : String(value),
    type: "text",
  }
}

export function customFieldsToDraft(value: JsonMapValue | null | undefined) {
  return Object.entries(value ?? {})
    .filter(([name]) => !RESERVED_SECTION_FIELD_NAMES.has(name))
    .map(([name, fieldValue], index) => ({
      ...parseSectionCustomFieldValue(fieldValue),
      id: `field-${index}-${name}`,
      key: name,
    }))
}

export function customFieldsToObject(fields: Array<{ key: string; value: string; type: CustomFieldType }>) {
  const entries = fields
    .map((field) => ({
      key: field.key.trim(),
      value: field.value.trim(),
      type: normalizeCustomFieldType(field.type),
    }))
    .filter((field) => field.key.length > 0)

  if (entries.length === 0) {
    return null
  }

  return Object.fromEntries(entries.map((field) => [field.key, { value: field.value, type: field.type }]))
}

export function applySectionImagesToCustomFields(
  customFields: JsonMapValue | null,
  images: string[],
) {
  const nextCustomFields = { ...(customFields ?? {}) }
  const normalizedImages = images.map((image) => image.trim()).filter((image) => image.length > 0).slice(0, 5)

  if (normalizedImages.length > 0) {
    nextCustomFields[SECTION_IMAGES] = normalizedImages
  } else {
    delete nextCustomFields[SECTION_IMAGES]
  }

  return Object.keys(nextCustomFields).length > 0 ? nextCustomFields : null
}

export function buildMarkerOptions(detail: RpgMapDetailViewDto | null): MarkerLinkOption[] {
  return (detail?.markerGroups ?? []).flatMap((group) =>
    group.markers.map((marker) => ({
      id: marker.id,
      groupId: group.id,
      visibility: "public" as const,
      name: marker.name,
      location: marker.location,
      shortDescription: marker.shortDescription,
      image: marker.image,
      color: marker.color || group.color,
      size: marker.size ?? null,
      pinStyle: marker.pinStyle === "label" ? "label" : "default",
    })),
  )
}

export function applyLinkedMarkerToPayload(
  payload: SectionSavePayload,
  linkedMarker: MarkerLinkOption,
  preference: "marker" | "section",
) {
  const nextCustomFields = { ...(payload.customFields ?? {}) }
  const normalizedSectionName = payload.name.trim()
  const normalizedSectionDescription = payload.description?.trim() ?? ""

  nextCustomFields[SECTION_LINK_MARKER_ID] = linkedMarker.id
  nextCustomFields[SECTION_LINK_MARKER_GROUP_ID] = linkedMarker.groupId
  nextCustomFields[SECTION_LINK_MARKER_NAME] = linkedMarker.name

  if (preference === "marker" || !nextCustomFields[SECTION_LINK_LOCATION]) {
    if (linkedMarker.location) {
      nextCustomFields[SECTION_LINK_LOCATION] = linkedMarker.location
    } else {
      delete nextCustomFields[SECTION_LINK_LOCATION]
    }
  }

  if (preference === "marker" || !nextCustomFields[SECTION_LINK_IMAGE]) {
    if (linkedMarker.image) {
      nextCustomFields[SECTION_LINK_IMAGE] = linkedMarker.image
    } else {
      delete nextCustomFields[SECTION_LINK_IMAGE]
    }
  }

  if (preference === "marker" || !nextCustomFields[SECTION_LINK_COLOR]) {
    if (linkedMarker.color) {
      nextCustomFields[SECTION_LINK_COLOR] = linkedMarker.color
    } else {
      delete nextCustomFields[SECTION_LINK_COLOR]
    }
  }

  return {
    ...payload,
    name:
      preference === "marker" || normalizedSectionName.length === 0
        ? linkedMarker.name
        : payload.name,
    description:
      preference === "marker" || normalizedSectionDescription.length === 0
        ? linkedMarker.shortDescription ?? payload.description
        : payload.description,
    customFields: Object.keys(nextCustomFields).length > 0 ? nextCustomFields : null,
  }
}

export function findLinkedMarkerConflicts(payload: SectionSavePayload, linkedMarker: MarkerLinkOption) {
  const customFields = payload.customFields ?? {}
  const conflicts: string[] = []

  if (payload.name.trim() && payload.name.trim() !== linkedMarker.name.trim()) {
    conflicts.push("Nome")
  }

  const sectionDescription = payload.description?.trim() ?? ""
  const markerDescription = linkedMarker.shortDescription?.trim() ?? ""
  if (sectionDescription && markerDescription && sectionDescription !== markerDescription) {
    conflicts.push("Descricao")
  }

  const sectionLocation = typeof customFields[SECTION_LINK_LOCATION] === "string" ? String(customFields[SECTION_LINK_LOCATION]).trim() : ""
  const markerLocation = linkedMarker.location?.trim() ?? ""
  if (sectionLocation && markerLocation && sectionLocation !== markerLocation) {
    conflicts.push("Localizacao")
  }

  const sectionImage = typeof customFields[SECTION_LINK_IMAGE] === "string" ? String(customFields[SECTION_LINK_IMAGE]).trim() : ""
  const markerImage = linkedMarker.image?.trim() ?? ""
  if (sectionImage && markerImage && sectionImage !== markerImage) {
    conflicts.push("Imagem")
  }

  const sectionColor = typeof customFields[SECTION_LINK_COLOR] === "string" ? String(customFields[SECTION_LINK_COLOR]).trim() : ""
  const markerColor = linkedMarker.color?.trim() ?? ""
  if (sectionColor && markerColor && sectionColor !== markerColor) {
    conflicts.push("Cor")
  }

  return conflicts
}

function buildMarkerDisplayFields(customFields: JsonMapValue | null | undefined) {
  return Object.entries(customFields ?? {})
    .map(([name, value]) => ({
      name,
      parsed: parseSectionCustomFieldValue(value),
    }))
    .filter(({ name, parsed }) => !INTERNAL_SECTION_FIELD_NAMES.has(name) && getStringValue(parsed.value).length > 0)
    .map(({ name, parsed }) => ({
      name,
      value: parsed.value,
      type: parsed.type,
    }))
}

export function buildLinkedSectionSnapshots(sections: RpgMapSectionDto[]): LinkedSectionSnapshot[] {
  return sections
    .map((section) => {
      const markerId = getLinkedMarkerId(section.customFields)
      if (!markerId) {
        return null
      }

      return {
        markerId,
        sectionId: section.id,
        name: section.name.trim(),
        description: section.description?.trim() || null,
        type: section.type?.trim() || null,
        images: getSectionImages(section.customFields),
        customFields: buildMarkerDisplayFields(section.customFields),
      }
    })
    .filter((section): section is LinkedSectionSnapshot => Boolean(section))
}

function buildMergedSectionCustomFields(
  customFields: JsonMapValue | null | undefined,
  linkedMarker: MarkerLinkOption | null,
) {
  const merged = { ...(customFields ?? {}) }

  if (linkedMarker?.location && !getStringValue(merged[SECTION_LINK_LOCATION])) {
    merged[SECTION_LINK_LOCATION] = linkedMarker.location
  }

  if (linkedMarker?.image && !getStringValue(merged[SECTION_LINK_IMAGE])) {
    merged[SECTION_LINK_IMAGE] = linkedMarker.image
  }

  if (linkedMarker?.color && !getStringValue(merged[SECTION_LINK_COLOR])) {
    merged[SECTION_LINK_COLOR] = linkedMarker.color
  }

  return Object.entries(merged)
    .map(([name, value]) => ({
      name,
      parsed: parseSectionCustomFieldValue(value),
    }))
    .filter(({ name, parsed }) => !INTERNAL_SECTION_FIELD_NAMES.has(name) && getStringValue(parsed.value).length > 0)
    .map(({ name, parsed }) => [name, parsed] as const)
}

export function buildSectionRenderState(section: RpgMapSectionDto, linkedMarker: MarkerLinkOption | null) {
  const sectionImages = getSectionImages(section.customFields)
  return {
    name: section.name.trim() || linkedMarker?.name || "Secao",
    description: section.description?.trim() || linkedMarker?.shortDescription || null,
    type: section.type?.trim() || null,
    images: sectionImages.length > 0 ? sectionImages : linkedMarker?.image ? [linkedMarker.image] : [],
    customFields: buildMergedSectionCustomFields(section.customFields, linkedMarker),
  }
}
