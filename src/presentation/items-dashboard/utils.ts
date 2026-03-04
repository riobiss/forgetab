export function parseNamedDescriptionList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }

      const maybeName = (entry as { name?: unknown }).name
      const maybeDescription = (entry as { description?: unknown }).description
      if (typeof maybeName !== "string" || typeof maybeDescription !== "string") {
        return null
      }

      const name = maybeName.trim()
      const description = maybeDescription.trim()
      if (!name || !description) {
        return null
      }

      return { name, description }
    })
    .filter((entry): entry is { name: string; description: string } => entry !== null)
}
