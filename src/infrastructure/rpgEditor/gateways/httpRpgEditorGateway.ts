import type { RpgEditorGateway } from "@/application/rpgEditor/contracts/RpgEditorGateway"
import type { CreateRpgPayloadDto, CreatedRpgDto } from "@/application/rpgEditor/types"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

export const httpRpgEditorGateway: RpgEditorGateway = {
  async createRpg(payload: CreateRpgPayloadDto): Promise<CreatedRpgDto> {
    const response = await fetch("/api/rpg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const result = await parseJson<{ rpg?: { id?: string } }>(response)
    const id = result.rpg?.id?.trim()
    if (!id) {
      throw new Error("Nao foi possivel criar o RPG.")
    }

    return { id }
  },

  async uploadRpgImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch("/api/uploads/rpg-image", {
      method: "POST",
      body: formData,
    })
    const result = await parseJson<{ url?: string }>(response)
    if (!result.url) {
      throw new Error("Nao foi possivel enviar imagem.")
    }

    return { url: result.url.trim() }
  },

  async deleteRpgImageByUrl(url: string): Promise<void> {
    const response = await fetch("/api/uploads/rpg-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })

    await parseJson<{ message?: string }>(response)
  },
}
