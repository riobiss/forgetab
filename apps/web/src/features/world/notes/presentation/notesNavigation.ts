const PAGE_LABELS: Record<string, string> = {
  characters: "Personagens",
  character: "Personagem",
  classes: "Classes",
  races: "Raças",
  items: "Itens",
  library: "Biblioteca",
  map: "Mapa",
  skills: "Habilidades",
  abilities: "Habilidades",
  edit: "Editar campanha"
}

export function campaignPath(rpgId: string) {
  return `/rpg/${rpgId}`
}

export function notesPath(rpgId: string) {
  return `${campaignPath(rpgId)}/notes`
}

export function resolveNotesReturnPath(
  rpgId: string,
  candidate?: string | null
) {
  const fallback = campaignPath(rpgId)
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback
  }

  try {
    const parsed = new URL(candidate, "https://forgetab.local")
    const notesRoute = notesPath(rpgId)
    const belongsToCampaign =
      parsed.pathname === fallback || parsed.pathname.startsWith(`${fallback}/`)
    const pointsToNotes =
      parsed.pathname === notesRoute ||
      parsed.pathname.startsWith(`${notesRoute}/`)

    if (!belongsToCampaign || pointsToNotes) return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export function createNotesHref(rpgId: string, returnPath: string) {
  const safeReturnPath = resolveNotesReturnPath(rpgId, returnPath)
  return `${notesPath(rpgId)}?returnTo=${encodeURIComponent(safeReturnPath)}`
}

export function notesReturnPageLabel(rpgId: string, returnPath: string) {
  const safePath = resolveNotesReturnPath(rpgId, returnPath)
  const pathname = safePath.split(/[?#]/, 1)[0]
  const section = pathname.slice(campaignPath(rpgId).length + 1).split("/")[0]
  return PAGE_LABELS[section] ?? "Campanha"
}
