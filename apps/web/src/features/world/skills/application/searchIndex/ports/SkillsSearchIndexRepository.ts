import type { SkillSearchIndexRow } from "@/features/world/skills/application/searchIndex/types"

export interface SkillsSearchIndexRepository {
  listSkillRows(params: {
    userId: string
    skillIds: string[]
    rpgId?: string | null
  }): Promise<SkillSearchIndexRow[]>
}
