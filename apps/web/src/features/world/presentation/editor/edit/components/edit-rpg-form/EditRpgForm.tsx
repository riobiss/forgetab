"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import {
  Paperclip,
  ImagePlus,
  LoaderCircle,
  Save,
  Trash2,
  X,
} from "lucide-react"
import styles from "../../page.module.css"
import RadixSwitchField from "../shared/RadixSwitchField"
import type { Visibility } from "../../hooks/useEditRpgState"

type Props = {
  title: string
  onTitleChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  image: string
  onImageUpload: (file: File) => Promise<void>
  onRemoveImage: () => void
  uploadingImage: boolean
  uploadError: string
  visibility: Visibility
  onVisibilityChange: (value: Visibility) => void
  error: string
  success: string
  saving: boolean
  deleting: boolean
  canDelete: boolean
  onSaveAll: () => Promise<void>
  onDeleteRpg: () => Promise<void>
}

export default function EditRpgForm({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  image,
  onImageUpload,
  onRemoveImage,
  uploadingImage,
  uploadError,
  visibility,
  onVisibilityChange,
  error,
  success,
  saving,
  deleting,
  canDelete,
  onSaveAll,
  onDeleteRpg,
}: Props) {
  const [selectedImageName, setSelectedImageName] = useState("")

  const imageStatusText = useMemo(() => {
    if (selectedImageName.trim().length > 0) {
      return selectedImageName
    }

    if (image.trim().length > 0) {
      const lastPathSegment = image.split("/").pop() ?? ""
      if (!lastPathSegment) return "Imagem atual selecionada"
      return decodeURIComponent(lastPathSegment)
    }

    return ""
  }, [image, selectedImageName])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSaveAll()
  }

  return (
    <>
      <form id="edit-rpg-form" className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
        <div className={styles.field}>
          <span>
            <Paperclip size={14} />
            Imagem do RPG
          </span>
          <div className={styles.fileUploadActions}>
            <label htmlFor="rpg-image-file" className={styles.fileUploadTrigger}>
              <ImagePlus size={16} />
              <span>Selecionar imagem</span>
            </label>
            {image ? (
              <button
                type="button"
                className={styles.fileRemoveButton}
                onClick={() => {
                  setSelectedImageName("")
                  onRemoveImage()
                }}
                disabled={saving || deleting || uploadingImage}
                aria-label="Remover imagem"
                title="Remover imagem"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
          <input
            id="rpg-image-file"
            className={styles.fileUploadInput}
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                setSelectedImageName(file.name)
                void onImageUpload(file)
              }
            }}
          />
          {imageStatusText ? <p className={styles.fileUploadStatus}>{imageStatusText}</p> : null}
        </div>

        <label className={styles.field}>
          <span>Titulo</span>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            minLength={3}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Descricao</span>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            minLength={10}
            maxLength={400}
            rows={5}
            required
          />
        </label>

        {uploadingImage ? <p>Enviando imagem...</p> : null}
        {uploadError ? <p className={styles.error}>{uploadError}</p> : null}

        <RadixSwitchField
          id="edit-rpg-visibility"
          label="Visibilidade"
          description={
            visibility === "public"
              ? "Publico: qualquer jogador pode visualizar"
              : "Privado: apenas membros podem visualizar"
          }
          checked={visibility === "public"}
          onCheckedChange={(checked) => onVisibilityChange(checked ? "public" : "private")}
        />

        {error ? <p className={styles.error}>{error}</p> : null}
        {success ? <p className={styles.success}>{success}</p> : null}
      </form>

      <div className={`${styles.actions} ${styles.footerActions}`}>
        <button type="submit" form="edit-rpg-form" disabled={saving}>
          {saving ? (
            <>
              <LoaderCircle size={16} className={styles.spin} />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Salvar</span>
            </>
          )}
        </button>
        {canDelete ? (
          <button type="button" onClick={() => void onDeleteRpg()} disabled={deleting || saving}>
            {deleting ? (
              <>
                <LoaderCircle size={16} className={styles.spin} />
                <span>Deletando...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Deletar</span>
              </>
            )}
          </button>
        ) : null}
        <Link href="/rpg">
          <X size={16} />
          <span>Cancelar</span>
        </Link>
      </div>
    </>
  )
}

