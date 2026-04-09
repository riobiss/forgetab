"use client"

export type CampaignPresence = {
  rpgId: string
  campaignId: string
  title: string
}

export type CampaignPresencePosition = {
  x: number
  y: number
}

export type CampaignSelectedCharacter = {
  id: string
  name: string
  image: string | null
}

const CAMPAIGN_PRESENCE_KEY = "forgetab:campaign-presence"
const CAMPAIGN_PRESENCE_POSITION_KEY = "forgetab:campaign-presence-position"
const CAMPAIGN_PRESENCE_EVENT = "forgetab:campaign-presence-changed"
const CAMPAIGN_SELECTED_CHARACTER_PREFIX = "forgetab:campaign-character:"

function dispatchPresenceChanged() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(CAMPAIGN_PRESENCE_EVENT))
}

export function getCampaignPresence(): CampaignPresence | null {
  if (typeof window === "undefined") return null

  const rawValue = window.localStorage.getItem(CAMPAIGN_PRESENCE_KEY)
  if (!rawValue) return null

  try {
    const parsedValue = JSON.parse(rawValue) as CampaignPresence
    if (!parsedValue?.rpgId || !parsedValue?.campaignId || !parsedValue?.title) {
      return null
    }

    return parsedValue
  } catch {
    return null
  }
}

export function setCampaignPresence(presence: CampaignPresence) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(CAMPAIGN_PRESENCE_KEY, JSON.stringify(presence))
  dispatchPresenceChanged()
}

export function clearCampaignPresence() {
  if (typeof window === "undefined") return

  window.localStorage.removeItem(CAMPAIGN_PRESENCE_KEY)
  dispatchPresenceChanged()
}

export function subscribeToCampaignPresence(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CAMPAIGN_PRESENCE_KEY) {
      listener()
    }
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(CAMPAIGN_PRESENCE_EVENT, listener)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(CAMPAIGN_PRESENCE_EVENT, listener)
  }
}

export function getCampaignPresencePosition(): CampaignPresencePosition | null {
  if (typeof window === "undefined") return null

  const rawValue = window.localStorage.getItem(CAMPAIGN_PRESENCE_POSITION_KEY)
  if (!rawValue) return null

  try {
    const parsedValue = JSON.parse(rawValue) as CampaignPresencePosition
    if (typeof parsedValue?.x !== "number" || typeof parsedValue?.y !== "number") {
      return null
    }

    return parsedValue
  } catch {
    return null
  }
}

export function setCampaignPresencePosition(position: CampaignPresencePosition) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(CAMPAIGN_PRESENCE_POSITION_KEY, JSON.stringify(position))
}

export function getCampaignSelectedCharacter(campaignId: string): CampaignSelectedCharacter | null {
  if (typeof window === "undefined") return null

  const rawValue = window.localStorage.getItem(`${CAMPAIGN_SELECTED_CHARACTER_PREFIX}${campaignId}`)
  if (!rawValue) return null

  try {
    const parsedValue = JSON.parse(rawValue) as CampaignSelectedCharacter
    if (!parsedValue?.id || !parsedValue?.name) {
      return null
    }

    return {
      id: parsedValue.id,
      name: parsedValue.name,
      image: parsedValue.image ?? null,
    }
  } catch {
    return null
  }
}

export function setCampaignSelectedCharacter(
  campaignId: string,
  character: CampaignSelectedCharacter,
) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(
    `${CAMPAIGN_SELECTED_CHARACTER_PREFIX}${campaignId}`,
    JSON.stringify(character),
  )
}

export function clearCampaignSelectedCharacter(campaignId: string) {
  if (typeof window === "undefined") return

  window.localStorage.removeItem(`${CAMPAIGN_SELECTED_CHARACTER_PREFIX}${campaignId}`)
}
