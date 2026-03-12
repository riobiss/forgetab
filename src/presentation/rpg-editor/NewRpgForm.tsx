"use client"

import { FormEvent, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "react-hot-toast"
import type { RpgEditorDependencies } from "@/application/rpgEditor/contracts/RpgEditorDependencies"
import {
  createRpgUseCase,
  deleteRpgImageByUrlUseCase,
  uploadRpgImageUseCase,
} from "@/application/rpgEditor/use-cases/rpgEditor"
import styles from "./NewRpgForm.module.css"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import {
  getDefaultProgressionTiers,
  getProgressionModeLabel,
  type ProgressionMode,
} from "@/lib/rpg/progression"
import { dismissToast } from "@/lib/toast"

type Props = {
  deps: RpgEditorDependencies
}

export default function NewRpgForm({ deps }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [useRaceBonuses, setUseRaceBonuses] = useState(false)
  const [useClassBonuses, setUseClassBonuses] = useState(false)
  const [progressionMode, setProgressionMode] = useState<ProgressionMode>("xp_level")
  const [isProgressionModalOpen, setIsProgressionModalOpen] = useState(false)
  const [costsEnabled, setCostsEnabled] = useState(false)
  const [costResourceName, setCostResourceName] = useState("Skill Points")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const creatingRef = useRef(false)

  function handleImageUpload(file: File) {
    setSelectedImageFile(file)
    setImage("")
    setUploadError("")
    setError("")
  }

  function handleRemoveImage() {
    setSelectedImageFile(null)
    setImage("")
    setUploadError("")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creatingRef.current) return
    creatingRef.current = true
    setLoading(true)
    setError("")
    const loadingToastId = toast.loading("Criando RPG...")
    let uploadedImageUrl = ""
    let hasFreshUpload = false

    try {
      uploadedImageUrl = image.trim() || ""

      if (selectedImageFile) {
        setUploadingImage(true)
        try {
          const upload = await uploadRpgImageUseCase(deps, { file: selectedImageFile })
          uploadedImageUrl = upload.url
          hasFreshUpload = true
          setImage(uploadedImageUrl)
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : "Nao foi possivel enviar imagem."
          setUploadError(message)
          setError(message)
          toast.error(message)
          return
        } finally {
          setUploadingImage(false)
        }
      }

      await createRpgUseCase(deps, {
        payload: {
          title,
          description,
          ...(uploadedImageUrl ? { image: uploadedImageUrl } : {}),
          visibility,
          costsEnabled,
          costResourceName,
          useRaceBonuses,
          useClassBonuses,
          progressionMode,
          progressionTiers: getDefaultProgressionTiers(progressionMode),
        },
      })

      setSelectedImageFile(null)
      toast.success("RPG criado com sucesso.")
      router.push("/rpg")
      router.refresh()
    } catch (cause) {
      if (hasFreshUpload && uploadedImageUrl) {
        try {
          await deleteRpgImageByUrlUseCase(deps, { url: uploadedImageUrl })
        } catch {
          // Nao bloqueia a resposta de erro se a limpeza da imagem falhar.
        }
      }
      const message = cause instanceof Error ? cause.message : "Erro de conexao ao criar RPG."
      setError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setUploadingImage(false)
      setLoading(false)
      creatingRef.current = false
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Criar RPG</h1>
        <p>Defina as informacoes iniciais da campanha.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Titulo</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Descricao</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={10}
              maxLength={400}
              rows={5}
              required
            />
          </label>

          <label className={styles.field}>
            <span>Visibilidade</span>
            <NativeSelectField
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as "private" | "public")
              }
            >
              <option value="private">Privado</option>
              <option value="public">Publico</option>
            </NativeSelectField>
          </label>

         
          <label className={styles.field}>
            <span>imagem do RPG</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  handleImageUpload(file)
                }
              }}
            />
          </label>

          {image || selectedImageFile ? (
            <div className={styles.actions}>
              <button type="button" onClick={handleRemoveImage} disabled={uploadingImage || loading}>
                Remover imagem
              </button>
            </div>
          ) : null}

          {selectedImageFile ? <p>Imagem selecionada: {selectedImageFile.name}</p> : null}
          {uploadingImage ? <p>Enviando imagem...</p> : null}
          {uploadError ? <p className={styles.error}>{uploadError}</p> : null}

          <label className={styles.field}>
            <span>Sistema de Custos</span>
            <NativeSelectField
              value={costsEnabled ? "enabled" : "disabled"}
              onChange={(event) => setCostsEnabled(event.target.value === "enabled")}
            >
              <option value="disabled">Desativado</option>
              <option value="enabled">Ativado</option>
            </NativeSelectField>
          </label>

          <label className={styles.field}>
            <span>Usar raca</span>
            <NativeSelectField
              value={useRaceBonuses ? "enabled" : "disabled"}
              onChange={(event) => setUseRaceBonuses(event.target.value === "enabled")}
            >
              <option value="disabled">Nao</option>
              <option value="enabled">Sim</option>
            </NativeSelectField>
          </label>

          <label className={styles.field}>
            <span>Usar classe</span>
            <NativeSelectField
              value={useClassBonuses ? "enabled" : "disabled"}
              onChange={(event) => setUseClassBonuses(event.target.value === "enabled")}
            >
              <option value="disabled">Nao</option>
              <option value="enabled">Sim</option>
            </NativeSelectField>
          </label>

          <label className={styles.field}>
            <span>Progressao</span>
            <button
              type="button"
              className={styles.progressionButton}
              onClick={() => setIsProgressionModalOpen(true)}
            >
              {getProgressionModeLabel(progressionMode)}
            </button>
          </label>

          <label className={styles.field}>
            <span>Nome do recurso de custo</span>
            <input
              type="text"
              value={costResourceName}
              onChange={(event) => setCostResourceName(event.target.value)}
              minLength={1}
              maxLength={60}
              required
            />
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar RPG"}
            </button>

            <Link href="/rpg">Cancelar</Link>
          </div>
        </form>

        {isProgressionModalOpen ? (
          <div
            className={styles.modalOverlay}
            onClick={() => setIsProgressionModalOpen(false)}
            role="presentation"
          >
            <div
              className={styles.modalCard}
              role="dialog"
              aria-modal="true"
              aria-label="Selecionar progressao"
              onClick={(event) => event.stopPropagation()}
            >
              <h3>Selecionar progressao</h3>
              <p>Escolha apenas uma opcao.</p>
              <div className={styles.modalOptions}>
                {(["xp_level", "rank", "custom"] as ProgressionMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={
                      progressionMode === mode
                        ? `${styles.modalOption} ${styles.modalOptionActive}`
                        : styles.modalOption
                    }
                    onClick={() => {
                      setProgressionMode(mode)
                      setIsProgressionModalOpen(false)
                    }}
                  >
                    {getProgressionModeLabel(mode)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setIsProgressionModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
