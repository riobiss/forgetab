import type { SkillSearchIndexRow } from "@/features/skillsSearchIndex/application/types"

export interface SkillsSearchIndexRepository {
  listSkillRows(params: {
    userId: string
    skillIds: string[]
    rpgId?: string | null
  }): Promise<SkillSearchIndexRow[]>
}
