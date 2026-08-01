export interface LibraryPageGateway {
  fetchRpgTitle(rpgId: string): Promise<string>
  fetchSectionTitle(rpgId: string, sectionId: string): Promise<string | null>
}
