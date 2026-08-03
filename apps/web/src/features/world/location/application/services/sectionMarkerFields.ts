import type { JsonMapValue } from "@forgetab/world-contracts/location"

export const SECTION_LINK_MARKER_ID = "MarcadorId"
export const SECTION_LINK_MARKER_GROUP_ID = "MarcadorGrupoId"
export const SECTION_LINK_MARKER_NAME = "MarcadorNome"
export const SECTION_LINK_LOCATION = "Localizacao"
export const SECTION_LINK_IMAGE = "Imagem"
export const SECTION_LINK_COLOR = "Cor"
export const SECTION_IMAGES = "ImagensSecao"

export function getStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function getOptionalStringValue(value: unknown) {
  const normalized = getStringValue(value)
  return normalized.length > 0 ? normalized : null
}

export function getLinkedMarkerId(
  value: JsonMapValue | null | undefined,
) {
  const markerId = value?.[SECTION_LINK_MARKER_ID]
  return typeof markerId === "string" ? markerId : ""
}

export function buildMarkerUpdateFromSection(params: {
  section: {
    name: string
    description: string | null
    customFields: JsonMapValue | null
  }
  marker: {
    name: string
    location: string | null
    shortDescription: string | null
    image: string | null
    color: string | null
  }
}) {
  const customFields = params.section.customFields ?? {}
  return {
    name: params.section.name.trim() || params.marker.name,
    location:
      getOptionalStringValue(customFields[SECTION_LINK_LOCATION]) ??
      params.marker.location,
    shortDescription:
      params.section.description?.trim() || params.marker.shortDescription,
    image:
      getOptionalStringValue(customFields[SECTION_LINK_IMAGE]) ??
      params.marker.image,
    color:
      getOptionalStringValue(customFields[SECTION_LINK_COLOR]) ??
      params.marker.color,
  }
}
