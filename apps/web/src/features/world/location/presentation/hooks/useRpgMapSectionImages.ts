"use client"

import {
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction
} from "react"
import { toast } from "react-hot-toast"
import {
  deleteRpgMapSectionImageByUrlUseCase,
  uploadRpgMapSectionImageUseCase
} from "@/features/world/location/application/use-cases/rpgMapImages.client"
import { rpgMapPresentationDeps } from "@/features/world/location/presentation/dependencies"
import type { SectionFormState } from "./useRpgMapSectionModalState"

export function useRpgMapSectionImages(params: {
  sectionForm: SectionFormState
  setSectionForm: Dispatch<SetStateAction<SectionFormState>>
}) {
  const sectionImageInputRef = useRef<HTMLInputElement | null>(null)
  const [sectionImageUploading, setSectionImageUploading] = useState(false)

  function openSectionImagePicker() {
    if (sectionImageUploading || params.sectionForm.images.length >= 5) return
    sectionImageInputRef.current?.click()
  }

  async function handleSectionImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem valida para a secao.")
      return
    }

    setSectionImageUploading(true)
    try {
      const payload = await uploadRpgMapSectionImageUseCase(
        rpgMapPresentationDeps.rpgMapGateway,
        { file }
      )
      params.setSectionForm((current) => ({
        ...current,
        images: [...current.images, payload.url].slice(0, 5)
      }))
      toast.success("Imagem da secao adicionada com sucesso.")
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Erro ao enviar imagem da secao."
      )
    } finally {
      setSectionImageUploading(false)
    }
  }

  async function removeSectionImage(imageUrl: string) {
    if (sectionImageUploading) return false

    setSectionImageUploading(true)
    try {
      await deleteRpgMapSectionImageByUrlUseCase(
        rpgMapPresentationDeps.rpgMapGateway,
        { url: imageUrl }
      )
      params.setSectionForm((current) => ({
        ...current,
        images: current.images.filter((image) => image !== imageUrl)
      }))
      toast.success("Imagem da secao removida com sucesso.")
      return true
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Erro ao remover imagem da secao."
      )
      return false
    } finally {
      setSectionImageUploading(false)
    }
  }

  return {
    handleSectionImageChange,
    openSectionImagePicker,
    removeSectionImage,
    sectionImageInputRef,
    sectionImageUploading
  }
}
