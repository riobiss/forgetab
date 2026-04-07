export type SkillsPageRepository = {
  getRpgSummary(rpgId: string): Promise<{ id: string; title: string } | null>
}
