"use client"

import { Check, ImagePlus, X } from "lucide-react"
import NextImage from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import {
  updateRpgProfileClientUseCase,
  uploadRpgProfileImageClientUseCase,
} from "@/features/profile/application/use-cases/updateProfileClient"
import { createProfileDependencies } from "@/features/profile/presentation/dependencies"
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
  "#7a5c9e",
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

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", () =>
      reject(new Error("Nao foi possivel carregar a imagem.")),
    )
    image.src = src
  })
}

async function createRoundCroppedFile(
  imageSrc: string,
  crop: Area,
): Promise<File> {
  const image = await loadImage(imageSrc)
  const size = Math.min(crop.width, crop.height)
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Nao foi possivel preparar o recorte.")
  }

  context.clearRect(0, 0, size, size)
  context.save()
  context.beginPath()
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  context.closePath()
  context.clip()
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size,
  )
  context.restore()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  )

  if (!blob) {
    throw new Error("Nao foi possivel gerar a imagem.")
  }

  return new File([blob], "profile-image.png", { type: "image/png" })
}

export default function ProfileRpgImageField({
  rpgId,
  imageUrl,
  fallbackName,
}: Props) {
  const router = useRouter()
  const deps = useMemo(() => createProfileDependencies("http"), [])
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

    if (!file.type.startsWith("image/")) {
      setError("Arquivo de imagem invalido.")
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
      const file = await createRoundCroppedFile(sourceImage, croppedAreaPixels)
      const upload = await uploadRpgProfileImageClientUseCase(deps, {
        file,
        oldUrl: imageUrl,
      })
      await updateRpgProfileClientUseCase(deps, {
        rpgId,
        payload: { profileImageUrl: upload.url },
      })
      closeEditor()
      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao salvar imagem.",
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
                  `${rpgId}:${fallbackName}`,
                ),
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
