export type NotesCampaignAccess = {
  exists: boolean
  canUseNotes: boolean
}

export interface NotesAccessService {
  getCampaignAccess(rpgId: string, userId: string): Promise<NotesCampaignAccess>
}
