export type ProfileRpgCharacter = {
  id: string
  name: string
}

export type ProfileRpgSummary = {
  id: string
  title: string
  nickname: string | null
  joinedAt: Date | null
  characters: ProfileRpgCharacter[]
}

export type ProfileUserRecord = {
  name: string | null
  username: string | null
  email: string | null
  createdAt: Date | null
  ownedRpgs: Array<{
    id: string
    title: string
    createdAt: Date | null
  }>
  memberships: Array<{
    rpgId: string
    rpgTitle: string
    createdAt: Date | null
    requestedAt: Date | null
    respondedAt: Date | null
  }>
  rpgDisplayNames: Array<{
    rpgId: string
    displayName: string | null
  }>
  characters: Array<{
    id: string
    name: string
    rpgId: string
  }>
}

export type ProfileViewData = {
  name: string | null
  username: string | null
  email: string
  createdAt: Date | null
  rpgProfiles: ProfileRpgSummary[]
}
