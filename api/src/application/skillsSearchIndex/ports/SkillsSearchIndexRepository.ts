import type { SkillSearchIndexRow } from "@/application/skillsSearchIndex/types"

export interface SkillsSearchIndexRepository {
  listSkillRows(params: {
    userId: string
    skillIds: string[]
    rpgId?: string | null
  }): Promise<SkillSearchIndexRow[]>
}
