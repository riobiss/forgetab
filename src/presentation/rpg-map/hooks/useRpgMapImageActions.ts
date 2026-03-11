"use client"

import { useMemo, useState } from "react"
import {
  deleteRpgMapImageByUrlUseCase,
  persistRpgMapImageUseCase,
  uploadRpgMapImageUseCase,
} from "@/application/rpgMap/use-cases/rpgMap"
import { httpRpgMapGateway } from "@/infrastructure/rpgMap/gateways/httpRpgMapGateway"

const DEFAULT_MAP_SRC = "/map/world-map.png"
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024

export function useRpgMapImageActions(params: {
  rpgId: string
  isOwner: boolean
  mapSrc: string
  setMapSrc: (next: string) => void
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  const gateway = useMemo(() => httpRpgMapGateway, [])

  async function handleMapFile(file: File | null) {
    if (!params.isOwner || !file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      setUploadMessage("Envie um arquivo de imagem valido.")
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadMessage("Imagem muito grande. Limite de 8MB.")
      return
    }

    setIsUploading(true)
    setUploadMessage(null)

    try {
      const uploadPayload = await uploadRpgMapImageUseCase(gateway, {
        file,
        oldUrl: params.mapSrc !== DEFAULT_MAP_SRC ? params.mapSrc : null,
      })

      await persistRpgMapImageUseCase(gateway, {
        rpgId: params.rpgId,
        mapImage: uploadPayload.url,
      })

      params.setMapSrc(uploadPayload.url)
      setUploadMessage("Mapa atualizado com sucesso.")
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Erro ao atualizar mapa.")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleResetMapImage() {
    if (!params.isOwner || isUploading) {
      return
    }

    setIsUploading(true)
    setUploadMessage(null)

    try {
      if (params.mapSrc !== DEFAULT_MAP_SRC) {
        await deleteRpgMapImageByUrlUseCase(gateway, { url: params.mapSrc })
      }

      await persistRpgMapImageUseCase(gateway, {
        rpgId: params.rpgId,
        mapImage: null,
      })

      params.setMapSrc(DEFAULT_MAP_SRC)
      setUploadMessage("Imagem do mapa removida com sucesso.")
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Erro ao restaurar mapa.")
    } finally {
      setIsUploading(false)
    }
  }

  return {
    isUploading,
    uploadMessage,
    handleMapFile,
    handleResetMapImage,
  }
}
