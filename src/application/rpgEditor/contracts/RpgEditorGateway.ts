import type { CreateRpgPayloadDto, CreatedRpgDto } from "@/application/rpgEditor/types"

export interface RpgEditorGateway {
  createRpg(payload: CreateRpgPayloadDto): Promise<CreatedRpgDto>
  uploadRpgImage(file: File): Promise<{ url: string }>
  deleteRpgImageByUrl(url: string): Promise<void>
}
