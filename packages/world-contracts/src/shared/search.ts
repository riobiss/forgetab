export type SearchValue = string | number | null | undefined

const SEARCH_SEPARATOR_PATTERN = /[^\p{Letter}\p{Number}]+/gu

export function normalizeSearchText(value: SearchValue): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(SEARCH_SEPARATOR_PATTERN, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function buildSearchText(values: readonly SearchValue[]): string {
  return normalizeSearchText(values.filter((value) => value != null).join(" "))
}

export function matchesSearch(
  values: SearchValue | readonly SearchValue[],
  query: SearchValue
): boolean {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  const searchText = Array.isArray(values)
    ? buildSearchText(values)
    : normalizeSearchText(values as SearchValue)

  return normalizedQuery.split(" ").every((term) => searchText.includes(term))
}
