import type {
  CreateCreaturePayloadDto,
  CreatureEditorBootstrapDto,
  CreatureSummaryDto,
  CreatureTemplateCategoryDto,
  CreatureTemplateExtrasDto,
  CreatureTemplatesConfigDto,
  UpdateCreaturePayloadDto,
} from "@/application/creatures/types"
import type { CharactersDashboardViewModel } from "@/application/charactersDashboard/types"

export interface CreaturesGateway {
  fetchDashboard(rpgId: string): Promise<CharactersDashboardViewModel>
  fetchBootstrap(rpgId: string): Promise<CreatureEditorBootstrapDto>
  fetchTemplates(rpgId: string): Promise<CreatureTemplateCategoryDto[]>
  fetchTemplatesConfig(rpgId: string): Promise<CreatureTemplatesConfigDto>
  updateTemplates(
    rpgId: string,
    categories: CreatureTemplateCategoryDto[],
    extras?: CreatureTemplateExtrasDto,
  ): Promise<void>
  fetchCreature(rpgId: string, creatureId: string): Promise<CreatureSummaryDto>
  createCreature(rpgId: string, payload: CreateCreaturePayloadDto): Promise<CreatureSummaryDto>
  updateCreature(
    rpgId: string,
    creatureId: string,
    payload: UpdateCreaturePayloadDto,
  ): Promise<CreatureSummaryDto>
  deleteCreature(rpgId: string, creatureId: string): Promise<void>
  uploadCreatureImage(file: File): Promise<{ url: string }>
}
