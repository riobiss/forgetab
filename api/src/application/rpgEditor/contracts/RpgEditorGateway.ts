import type {
  CreateRpgPayloadDto,
  CreatedRpgDto,
  RpgEditorBootstrapDto,
  RpgEditorCatalogOptionDto,
  RpgEditorIdentityFieldDto,
  RpgEditorTemplateFieldDto,
  UpdateRpgPayloadDto,
} from "@/application/rpgEditor/types"

export interface RpgEditorGateway {
  fetchBootstrap(rpgId: string): Promise<RpgEditorBootstrapDto>
  createRpg(payload: CreateRpgPayloadDto): Promise<CreatedRpgDto>
  updateRpg(rpgId: string, payload: UpdateRpgPayloadDto): Promise<void>
  saveAttributes(rpgId: string, attributes: RpgEditorTemplateFieldDto[]): Promise<void>
  saveStatuses(rpgId: string, statuses: RpgEditorTemplateFieldDto[]): Promise<void>
  saveSkills(rpgId: string, skills: string[]): Promise<void>
  saveRaces(rpgId: string, races: RpgEditorCatalogOptionDto[]): Promise<void>
  saveClasses(rpgId: string, classes: RpgEditorCatalogOptionDto[]): Promise<void>
  saveCharacterIdentityFields(rpgId: string, fields: RpgEditorIdentityFieldDto[]): Promise<void>
  saveCharacterCharacteristicFields(
    rpgId: string,
    fields: RpgEditorIdentityFieldDto[],
  ): Promise<void>
  deleteRpg(rpgId: string): Promise<void>
  uploadRpgImage(file: File): Promise<{ url: string }>
  deleteRpgImageByUrl(url: string): Promise<void>
}
