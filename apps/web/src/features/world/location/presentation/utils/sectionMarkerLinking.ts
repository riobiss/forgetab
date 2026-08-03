"use client"

import {
  normalizeCustomFieldType,
  type CustomFieldType,
} from "@/components/custom-fields/typedCustomField"
import type {
  JsonMapValue,
  RpgMapDetailViewDto,
  RpgMapSectionDto,
} from "@forgetab/world-contracts/location"
import type {
  LinkedSectionSnapshot,
  MarkerPinStyle,
} from "@/features/world/location/presentation/types/mapMarkers"
import {
  getLinkedMarkerId,
  getStringValue,
  SECTION_IMAGES,
  SECTION_LINK_COLOR,
  SECTION_LINK_IMAGE,
  SECTION_LINK_LOCATION,
  SECTION_LINK_MARKER_GROUP_ID,
  SECTION_LINK_MARKER_ID,
  SECTION_LINK_MARKER_NAME,
} from "@/features/world/location/application/services/sectionMarkerFields"
import type { SectionMarkerLink } from "@/features/world/location/application/services/sectionMarkerReconciliation"

export {
  getLinkedMarkerId,
  getOptionalStringValue,
  getStringValue,
  SECTION_IMAGES,
  SECTION_LINK_COLOR,
  SECTION_LINK_IMAGE,
  SECTION_LINK_LOCATION,
  SECTION_LINK_MARKER_GROUP_ID,
  SECTION_LINK_MARKER_ID,
  SECTION_LINK_MARKER_NAME,
} from "@/features/world/location/application/services/sectionMarkerFields"

export type MarkerLinkOption = SectionMarkerLink & {
  size: number | null
  pinStyle: MarkerPinStyle | null
}

type SerializedSectionCustomField = {
  value: string
  type: CustomFieldType
}

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

function parseSectionCustomFieldValue(
  value: unknown,
): SerializedSectionCustomField {
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

export function customFieldsToObject(
  fields: Array<{ key: string; value: string; type: CustomFieldType }>,
) {
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

  return Object.fromEntries(
    entries.map((field) => [
      field.key,
      { value: field.value, type: field.type },
    ]),
  )
}

export function applySectionImagesToCustomFields(
  customFields: JsonMapValue | null,
  images: string[],
) {
  const nextCustomFields = { ...(customFields ?? {}) }
  const normalizedImages = images
    .map((image) => image.trim())
    .filter((image) => image.length > 0)
    .slice(0, 5)

  if (normalizedImages.length > 0) {
    nextCustomFields[SECTION_IMAGES] = normalizedImages
  } else {
    delete nextCustomFields[SECTION_IMAGES]
  }

  return Object.keys(nextCustomFields).length > 0 ? nextCustomFields : null
}

export function buildMarkerOptions(
  detail: RpgMapDetailViewDto | null,
): MarkerLinkOption[] {
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

function buildMarkerDisplayFields(
  customFields: JsonMapValue | null | undefined,
) {
  return Object.entries(customFields ?? {})
    .map(([name, value]) => ({
      name,
      parsed: parseSectionCustomFieldValue(value),
    }))
    .filter(
      ({ name, parsed }) =>
        !INTERNAL_SECTION_FIELD_NAMES.has(name) &&
        getStringValue(parsed.value).length > 0,
    )
    .map(({ name, parsed }) => ({
      name,
      value: parsed.value,
      type: parsed.type,
    }))
}

export function buildLinkedSectionSnapshots(
  sections: RpgMapSectionDto[],
): LinkedSectionSnapshot[] {
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

  if (
    linkedMarker?.location &&
    !getStringValue(merged[SECTION_LINK_LOCATION])
  ) {
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
    .filter(
      ({ name, parsed }) =>
        !INTERNAL_SECTION_FIELD_NAMES.has(name) &&
        getStringValue(parsed.value).length > 0,
    )
    .map(({ name, parsed }) => [name, parsed] as const)
}

export function buildSectionRenderState(
  section: RpgMapSectionDto,
  linkedMarker: MarkerLinkOption | null,
) {
  const sectionImages = getSectionImages(section.customFields)
  return {
    name: section.name.trim() || linkedMarker?.name || "Secao",
    description:
      section.description?.trim() || linkedMarker?.shortDescription || null,
    type: section.type?.trim() || null,
    images:
      sectionImages.length > 0
        ? sectionImages
        : linkedMarker?.image
          ? [linkedMarker.image]
          : [],
    customFields: buildMergedSectionCustomFields(
      section.customFields,
      linkedMarker,
    ),
  }
}
