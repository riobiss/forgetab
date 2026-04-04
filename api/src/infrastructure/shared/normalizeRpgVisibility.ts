export function normalizeRpgVisibility(value: string | null | undefined): "private" | "public" {
  return value === "private" ? "private" : "public"
}
