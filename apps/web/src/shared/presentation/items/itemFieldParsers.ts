export type NamedDescriptionEntry = {
  name: string
  description: string
}

export type CustomFieldEntry = {
  name: string
  value: string
}

export function parseNamedDescriptionList(
  value: unknown
): NamedDescriptionEntry[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null

      const maybeName = (entry as { name?: unknown }).name
      const maybeDescription = (entry as { description?: unknown }).description
      if (
        typeof maybeName !== "string" ||
        typeof maybeDescription !== "string"
      ) {
        return null
      }

      const description = maybeDescription.trim()
      return description ? { name: maybeName.trim(), description } : null
    })
    .filter((entry): entry is NamedDescriptionEntry => entry !== null)
}

export function parseCustomFieldList(value: unknown): CustomFieldEntry[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null

      const maybeName = (entry as { name?: unknown }).name
      const maybeValue = (entry as { value?: unknown }).value
      if (typeof maybeName !== "string" || !maybeName.trim()) return null

      return {
        name: maybeName.trim(),
        value: typeof maybeValue === "string" ? maybeValue.trim() : ""
      }
    })
    .filter((entry): entry is CustomFieldEntry => entry !== null)
}
