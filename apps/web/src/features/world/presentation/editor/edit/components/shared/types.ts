export type IdentityTemplate = {
  key: string
  label: string
  position: number
  category?: string
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
  lore?: unknown
  catalogMeta?: unknown
}

export type CharacterIdentityTemplate = {
  key: string
  label: string
  required: boolean
  position: number
}

export type AttributeTemplate = {
  key: string
  label: string
}

export type SkillTemplate = {
  key: string
  label: string
}

export type CatalogOption = {
  key: string
  label: string
}
