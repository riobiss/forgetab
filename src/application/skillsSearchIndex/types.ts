export type SkillSearchIndexRow = {
  skillId: string
  slug: string
  tags: string[]
  levelNumber: number | null
  stats: unknown
}

export type SkillSearchIndexEntry = {
  searchBlob: string
  displayName: string
  filters: {
    categories: string[]
    types: string[]
    actionTypes: string[]
    tags: string[]
  }
}
