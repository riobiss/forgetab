export type UpdateProfilePayload = {
  name?: string
  username?: string
}

export type UpdateRpgProfilePayload = {
  displayName: string
}

export interface ProfileGateway {
  updateProfile(payload: UpdateProfilePayload): Promise<void>
  updateRpgProfile(rpgId: string, payload: UpdateRpgProfilePayload): Promise<void>
}
