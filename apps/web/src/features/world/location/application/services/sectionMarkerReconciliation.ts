import type { JsonMapValue } from "@forgetab/world-contracts/location"
import {
  SECTION_LINK_COLOR,
  SECTION_LINK_IMAGE,
  SECTION_LINK_LOCATION,
  SECTION_LINK_MARKER_GROUP_ID,
  SECTION_LINK_MARKER_ID,
  SECTION_LINK_MARKER_NAME,
} from "./sectionMarkerFields"

export type SectionMarkerLink = {
  id: string
  groupId: string
  visibility: "private" | "public"
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  color: string | null
}

export type SectionSavePayload = {
  name: string
  description: string | null
  type: string | null
  parentSectionId: string | null
  customFields: JsonMapValue | null
}

export function applyLinkedMarkerToPayload(
  payload: SectionSavePayload,
  linkedMarker: SectionMarkerLink,
  preference: "marker" | "section",
): SectionSavePayload {
  const nextCustomFields = { ...(payload.customFields ?? {}) }
  const normalizedSectionName = payload.name.trim()
  const normalizedSectionDescription = payload.description?.trim() ?? ""

  nextCustomFields[SECTION_LINK_MARKER_ID] = linkedMarker.id
  nextCustomFields[SECTION_LINK_MARKER_GROUP_ID] = linkedMarker.groupId
  nextCustomFields[SECTION_LINK_MARKER_NAME] = linkedMarker.name

  for (const [field, markerValue] of [
    [SECTION_LINK_LOCATION, linkedMarker.location],
    [SECTION_LINK_IMAGE, linkedMarker.image],
    [SECTION_LINK_COLOR, linkedMarker.color],
  ] as const) {
    if (preference !== "marker" && nextCustomFields[field]) continue
    if (markerValue) nextCustomFields[field] = markerValue
    else delete nextCustomFields[field]
  }

  return {
    ...payload,
    name:
      preference === "marker" || normalizedSectionName.length === 0
        ? linkedMarker.name
        : payload.name,
    description:
      preference === "marker" || normalizedSectionDescription.length === 0
        ? (linkedMarker.shortDescription ?? payload.description)
        : payload.description,
    customFields:
      Object.keys(nextCustomFields).length > 0 ? nextCustomFields : null,
  }
}

export function findLinkedMarkerConflicts(
  payload: SectionSavePayload,
  linkedMarker: SectionMarkerLink,
) {
  const customFields = payload.customFields ?? {}
  const conflicts: string[] = []

  if (payload.name.trim() && payload.name.trim() !== linkedMarker.name.trim()) {
    conflicts.push("Nome")
  }

  const sectionDescription = payload.description?.trim() ?? ""
  const markerDescription = linkedMarker.shortDescription?.trim() ?? ""
  if (
    sectionDescription &&
    markerDescription &&
    sectionDescription !== markerDescription
  ) {
    conflicts.push("Descricao")
  }

  for (const [label, field, markerValue] of [
    ["Localizacao", SECTION_LINK_LOCATION, linkedMarker.location],
    ["Imagem", SECTION_LINK_IMAGE, linkedMarker.image],
    ["Cor", SECTION_LINK_COLOR, linkedMarker.color],
  ] as const) {
    const sectionValue =
      typeof customFields[field] === "string"
        ? String(customFields[field]).trim()
        : ""
    if (
      sectionValue &&
      markerValue?.trim() &&
      sectionValue !== markerValue.trim()
    ) {
      conflicts.push(label)
    }
  }

  return conflicts
}
