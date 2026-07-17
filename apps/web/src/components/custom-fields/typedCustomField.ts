export const CUSTOM_FIELD_TYPE_VALUES = ["text", "link", "date", "boolean"] as const

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPE_VALUES)[number]

export type EditableTypedCustomField = {
  key: string
  value: string
  type: CustomFieldType
}

export const CUSTOM_FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Texto" },
  { value: "link", label: "Link" },
  { value: "date", label: "Data" },
  { value: "boolean", label: "Boolean" },
] as const

export function normalizeCustomFieldType(value: unknown): CustomFieldType {
  return typeof value === "string" && CUSTOM_FIELD_TYPE_VALUES.includes(value as CustomFieldType)
    ? (value as CustomFieldType)
    : "text"
}
