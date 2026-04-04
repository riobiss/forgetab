export type SkillsPageAccessService = {
  canManageRpg(rpgId: string, userId: string): Promise<boolean>
}
