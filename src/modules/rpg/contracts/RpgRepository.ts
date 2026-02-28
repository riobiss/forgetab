import type { ProgressionMode } from "@/lib/rpg/progression"
import type {
  RpgAdvancedSettingsInput,
  RpgCreateBaseInput,
  RpgCreateBaseResult,
  RpgCreateSettingsInput,
  RpgCoreUpdateInput,
  RpgRow,
} from "@/modules/rpg/domain/types"

export interface RpgRepository {
  createBase(data: RpgCreateBaseInput): Promise<RpgCreateBaseResult>
  applyCreateSettings(rpgId: string, data: RpgCreateSettingsInput): Promise<void>
  findById(rpgId: string): Promise<RpgRow | null>
  getCurrentProgressionMode(rpgId: string): Promise<ProgressionMode>
  getImageById(rpgId: string): Promise<string | null>
  getOwnedImage(rpgId: string, ownerId: string): Promise<string | null>
  updateCore(rpgId: string, data: RpgCoreUpdateInput): Promise<boolean>
  updateAdvanced(rpgId: string, data: RpgAdvancedSettingsInput): Promise<void>
  updateImage(rpgId: string, image: string | null): Promise<boolean>
  deleteOwned(rpgId: string, ownerId: string): Promise<boolean>
}
