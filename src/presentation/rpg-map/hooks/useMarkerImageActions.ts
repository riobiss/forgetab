import { type ChangeEvent, useMemo, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import {
  deleteRpgMapMarkerImageByUrlUseCase,
  uploadRpgMapMarkerImageUseCase,
} from "@/application/rpgMap/use-cases/rpgMap"
import { httpRpgMapGateway } from "@/infrastructure/rpgMap/gateways/httpRpgMapGateway"
import { dismissToast } from "@/lib/toast"

const MAX_MARKER_IMAGE_SIZE_BYTES = 8 * 1024 * 1024

type MarkerImageTarget = {
  mode: "pending" | "editing"
  markerId: string
}

type Params = {
  resolveOldImage: (target: MarkerImageTarget) => string | null
  applyUploadedImage: (target: MarkerImageTarget, url: string) => void
  applyRemovedImage: (target: MarkerImageTarget) => void
}

export function useMarkerImageActions(params: Params) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [target, setTarget] = useState<MarkerImageTarget | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const gateway = useMemo(() => httpRpgMapGateway, [])

  function openPicker(nextTarget: MarkerImageTarget) {
    setTarget(nextTarget)
    fileInputRef.current?.click()
  }

  async function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""

    if (!file || !target) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem valida para o marcador.")
      return
    }

    if (file.size > MAX_MARKER_IMAGE_SIZE_BYTES) {
      toast.error("Imagem muito grande. Limite de 8MB.")
      return
    }

    setIsUploading(true)
    const loadingToastId = toast.loading("Enviando imagem do marcador...")

    try {
      const uploadPayload = await uploadRpgMapMarkerImageUseCase(gateway, {
        file,
        oldUrl: params.resolveOldImage(target),
      })

      params.applyUploadedImage(target, uploadPayload.url)
      toast.success("Imagem do marcador atualizada com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar imagem do marcador.")
    } finally {
      dismissToast(loadingToastId)
      setIsUploading(false)
      setTarget(null)
    }
  }

  async function deleteImage(targetToDelete: MarkerImageTarget, imageUrl: string | null) {
    if (!imageUrl || isUploading) {
      return
    }

    setIsUploading(true)
    const loadingToastId = toast.loading("Removendo imagem do marcador...")

    try {
      await deleteRpgMapMarkerImageByUrlUseCase(gateway, { url: imageUrl })
      params.applyRemovedImage(targetToDelete)
      toast.success("Imagem do marcador removida com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover imagem do marcador.")
    } finally {
      dismissToast(loadingToastId)
      setIsUploading(false)
    }
  }

  return {
    fileInputRef,
    isUploading,
    openPicker,
    handleInputChange,
    deleteImage,
  }
}
