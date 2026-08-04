export type ProfileRpgCharacter = {
  id: string
  name: string
}

export type ProfileRpgSummary = {
  id: string
  title: string
  nickname: string | null
  profileImageUrl: string | null
  joinedAt: Date | null
  characters: ProfileRpgCharacter[]
}

export type ProfileViewData = {
  name: string | null
  username: string | null
  email: string
  createdAt: Date | null
  rpgProfiles: ProfileRpgSummary[]
}
