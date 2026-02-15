export type IdentityTemplate = {
  key: string
  label: string
  position: number
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
}

export type CharacterIdentityTemplate = {
  key: string
  label: string
  required: boolean
  position: number
}

export type SkillTemplate = {
  key: string
  label: string
}

export type CatalogOption = {
  key: string
  label: string
}
