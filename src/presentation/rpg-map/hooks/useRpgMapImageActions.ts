"use client"

import { useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import {
  deleteRpgMapImageByUrlUseCase,
  persistRpgMapImageUseCase,
  uploadRpgMapImageUseCase,
} from "@/application/rpgMap/use-cases/rpgMap"
import { httpRpgMapGateway } from "@/infrastructure/rpgMap/gateways/httpRpgMapGateway"
import { dismissToast } from "@/lib/toast"

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
    const loadingToastId = toast.loading("Atualizando mapa...")

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
      toast.success("Mapa atualizado com sucesso.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar mapa."
      setUploadMessage(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setIsUploading(false)
    }
  }

  async function handleResetMapImage() {
    if (!params.isOwner || isUploading) {
      return
    }

    setIsUploading(true)
    setUploadMessage(null)
    const loadingToastId = toast.loading("Removendo imagem do mapa...")

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
      toast.success("Imagem do mapa removida com sucesso.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao restaurar mapa."
      setUploadMessage(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
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
