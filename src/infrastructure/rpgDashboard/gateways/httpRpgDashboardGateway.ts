import type { RpgDashboardGateway } from "@/application/rpgDashboard/contracts/RpgDashboardGateway"

type ErrorPayload = { message?: string }

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.")
  }
  return payload
}

export const httpRpgDashboardGateway: RpgDashboardGateway = {
  async requestToJoinRpg(rpgId) {
    const response = await fetch(`/api/rpg/${rpgId}/members`, { method: "POST" })
    return parseJsonResponse(response)
  },

  async processMemberRequest(rpgId, memberId, action) {
    const method = action === "toggleModerator" ? "PATCH" : "PATCH"
    const response = await fetch(`/api/rpg/${rpgId}/members/${memberId}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    return parseJsonResponse(response)
  },

  async processCharacterRequest(rpgId, requestId, action) {
    const response = await fetch(`/api/rpg/${rpgId}/character-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    return parseJsonResponse(response)
  },

  async expelMember(rpgId, memberId) {
    const response = await fetch(`/api/rpg/${rpgId}/members/${memberId}`, {
      method: "DELETE",
    })
    return parseJsonResponse(response)
  },

  async fetchCharacters(rpgId) {
    const response = await fetch(`/api/rpg/${rpgId}/characters`)
    return parseJsonResponse(response)
  },

  async fetchClasses(rpgId) {
    const response = await fetch(`/api/rpg/${rpgId}/classes`)
    return parseJsonResponse(response)
  },

  async fetchRpg(rpgId) {
    const response = await fetch(`/api/rpg/${rpgId}`)
    return parseJsonResponse(response)
  },

  async grantPoints(characterId, amount) {
    const response = await fetch(`/api/characters/${characterId}/grant-points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
    return parseJsonResponse(response)
  },

  async grantXp(characterId, amount) {
    const response = await fetch(`/api/characters/${characterId}/grant-xp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
    return parseJsonResponse(response)
  },
}
