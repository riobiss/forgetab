"use client"

import { Check, ImagePlus, X } from "lucide-react"
import NextImage from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import {
  updateRpgProfileClientUseCase,
  uploadRpgProfileImageClientUseCase
} from "@/features/profile/application/use-cases/updateProfileClient"
import { profileDependencies } from "@/features/profile/presentation/dependencies"
import {
  isAllowedImageMimeType,
  MAX_IMAGE_FILE_SIZE_BYTES
} from "@forgetab/world-contracts/media"
import styles from "./ProfilePage.module.css"

type Props = {
  rpgId: string
  imageUrl: string | null
  fallbackName: string
}

type CropPoint = {
  x: number
  y: number
}

const fallbackBackgrounds = [
  "#3b6ea8",
  "#8b5a2b",
  "#28705f",
  "#9a4d5c",
  "#6b5b95",
  "#a05f2c",
  "#3f6f3f",
  "#7a5c9e"
]

function getFallbackInitial(name: string) {
  const normalized = name.trim()
  return (normalized[0] ?? "?").toUpperCase()
}

function getFallbackBackground(seed: string) {
  let hash = 0

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return fallbackBackgrounds[hash % fallbackBackgrounds.length]
}

export default function ProfileRpgImageField({
  rpgId,
  imageUrl,
  fallbackName
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<CropPoint>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  function closeEditor() {
    if (sourceImage) {
      URL.revokeObjectURL(sourceImage)
    }

    setSourceImage(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError("")
  }

  function selectFile(file: File | undefined) {
    if (!file) {
      return
    }

    if (!isAllowedImageMimeType(file.type)) {
      setError("Arquivo de imagem invalido.")
      return
    }

    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      setError("Imagem muito grande. Limite de 8MB.")
      return
    }

    if (sourceImage) {
      URL.revokeObjectURL(sourceImage)
    }

    setSourceImage(URL.createObjectURL(file))
    setError("")
  }

  async function saveImage() {
    if (!sourceImage || !croppedAreaPixels) {
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const file = await profileDependencies.createRoundCroppedFile(
        sourceImage,
        croppedAreaPixels
      )
      const upload = await uploadRpgProfileImageClientUseCase(
        profileDependencies,
        {
          file,
          oldUrl: imageUrl
        }
      )
      await updateRpgProfileClientUseCase(profileDependencies, {
        rpgId,
        payload: { profileImageUrl: upload.url }
      })
      closeEditor()
      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao salvar imagem."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.profileImageField}>
      <div
        className={styles.profileImagePreview}
        style={
          imageUrl
            ? undefined
            : {
                backgroundColor: getFallbackBackground(
                  `${rpgId}:${fallbackName}`
                )
              }
        }
      >
        {imageUrl ? (
          <NextImage src={imageUrl} alt="" width={72} height={72} unoptimized />
        ) : (
          <strong>{getFallbackInitial(fallbackName)}</strong>
        )}
      </div>

      <button
        type="button"
        className={styles.imageActionButton}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus size={16} aria-hidden="true" />
        <span>{imageUrl ? "Trocar imagem" : "Adicionar imagem"}</span>
      </button>

      <input
        ref={inputRef}
        className={styles.fileInput}
        type="file"
        accept="image/*"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />

      {error && !sourceImage ? (
        <small className={styles.editableError}>{error}</small>
      ) : null}

      {sourceImage ? (
        <div
          className={styles.cropBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Imagem"
        >
          <div className={styles.cropDialog}>
            <div className={styles.cropHeader}>
              <strong>Imagem</strong>
              <button
                type="button"
                className={styles.iconButton}
                onClick={closeEditor}
                disabled={isSaving}
                aria-label="Fechar"
                title="Fechar"
              >
                <X size={14} />
              </button>
            </div>

            <div className={styles.cropStage}>
              <Cropper
                image={sourceImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            </div>

            <div className={styles.cropControls}>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                aria-label="Zoom"
              />
              <button
                type="button"
                className={styles.imageActionButton}
                onClick={saveImage}
                disabled={isSaving}
              >
                <Check size={16} aria-hidden="true" />
                <span>{isSaving ? "Salvando..." : "Salvar imagem"}</span>
              </button>
            </div>

            {error ? (
              <small className={styles.editableError}>{error}</small>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
