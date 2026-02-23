"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import styles from "./ItemEditorForm.module.css"
import {
  baseItemRarityValues,
  baseItemTypeValues,
} from "@/lib/validators/baseItem"
import { NativeSelectField } from "@/components/select/NativeSelectField"

type ItemType = (typeof baseItemTypeValues)[number]
type ItemRarity = (typeof baseItemRarityValues)[number]

type NamedDescription = {
  name: string
  description: string
}

type BaseItem = {
  id: string
  name: string
  image: string | null
  description: string | null
  preRequirement: string | null
  type: ItemType
  rarity: ItemRarity
  damage: string | null
  range: string | null
  ability: string | null
  abilityName: string | null
  effect: string | null
  effectName: string | null
  abilities: unknown
  effects: unknown
  weight: number | null
  duration: string | null
  durability: number | null
}

type ApiItemPayload = {
  item?: BaseItem
  message?: string
}

type UploadImagePayload = {
  message?: string
  url?: string
}

type Props = {
  mode: "create" | "edit"
  itemId?: string
}

function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toOptionalNumber(value: string, parser: (raw: string) => number) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = parser(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function parseNamedDescriptionList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }

      const maybeName = (entry as { name?: unknown }).name
      const maybeDescription = (entry as { description?: unknown }).description
      if (typeof maybeName !== "string" || typeof maybeDescription !== "string") {
        return null
      }

      const name = maybeName.trim()
      const description = maybeDescription.trim()
      if (!name || !description) {
        return null
      }

      return { name, description }
    })
    .filter((entry): entry is NamedDescription => entry !== null)
}

function updateAt(
  list: NamedDescription[],
  index: number,
  field: keyof NamedDescription,
  value: string,
) {
  return list.map((entry, entryIndex) =>
    entryIndex === index ? { ...entry, [field]: value } : entry,
  )
}

export default function ItemEditorForm({ mode, itemId }: Props) {
  const params = useParams<{ rpgId: string }>()
  const rpgId = params.rpgId
  const router = useRouter()
  const isEditing = useMemo(() => mode === "edit", [mode])

  const [loading, setLoading] = useState(isEditing)
  const [loadingError, setLoadingError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [description, setDescription] = useState("")
  const [preRequirement, setPreRequirement] = useState("")
  const [type, setType] = useState<ItemType>("weapon")
  const [rarity, setRarity] = useState<ItemRarity>("common")
  const [damage, setDamage] = useState("")
  const [range, setRange] = useState("")
  const [weight, setWeight] = useState("")
  const [duration, setDuration] = useState("")
  const [durability, setDurability] = useState("")
  const [abilities, setAbilities] = useState<NamedDescription[]>([
    { name: "", description: "" },
  ])
  const [effects, setEffects] = useState<NamedDescription[]>([
    { name: "", description: "" },
  ])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState("")
  const [pendingImageRemoval, setPendingImageRemoval] = useState(false)

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl)
      }
    }
  }, [selectedImagePreviewUrl])

  useEffect(() => {
    if (!isEditing || !itemId) {
      return
    }

    async function loadItem() {
      setLoading(true)
      setLoadingError("")

      try {
        const response = await fetch(`/api/rpg/${rpgId}/items/${itemId}`)
        const payload = (await response.json()) as ApiItemPayload

        if (!response.ok || !payload.item) {
          setLoadingError(payload.message ?? "Nao foi possivel carregar o item.")
          return
        }

        setName(payload.item.name)
        setImage(payload.item.image ?? "")
        setSelectedImageFile(null)
        setSelectedImagePreviewUrl((previousPreviewUrl) => {
          if (previousPreviewUrl) {
            URL.revokeObjectURL(previousPreviewUrl)
          }
          return ""
        })
        setPendingImageRemoval(false)
        setDescription(payload.item.description ?? "")
        setPreRequirement(payload.item.preRequirement ?? "")
        setType(payload.item.type)
        setRarity(payload.item.rarity)
        setDamage(payload.item.damage ?? "")
        setRange(payload.item.range ?? "")
        setWeight(payload.item.weight !== null ? String(payload.item.weight) : "")
        setDuration(payload.item.duration ?? "")
        setDurability(payload.item.durability !== null ? String(payload.item.durability) : "")

        const parsedAbilities = parseNamedDescriptionList(payload.item.abilities)
        const parsedEffects = parseNamedDescriptionList(payload.item.effects)

        if (parsedAbilities.length > 0) {
          setAbilities(parsedAbilities)
        } else if (payload.item.abilityName || payload.item.ability) {
          setAbilities([
            {
              name: payload.item.abilityName ?? "",
              description: payload.item.ability ?? "",
            },
          ])
        }

        if (parsedEffects.length > 0) {
          setEffects(parsedEffects)
        } else if (payload.item.effectName || payload.item.effect) {
          setEffects([
            {
              name: payload.item.effectName ?? "",
              description: payload.item.effect ?? "",
            },
          ])
        }
      } catch {
        setLoadingError("Erro de conexao ao carregar o item.")
      } finally {
        setLoading(false)
      }
    }

    void loadItem()
  }, [isEditing, itemId, rpgId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    savingRef.current = true
    setSubmitError("")
    setSaving(true)

    const normalizedAbilities = abilities
      .map((entry) => ({
        name: entry.name.trim(),
        description: entry.description.trim(),
      }))
      .filter((entry) => entry.name && entry.description)

    const normalizedEffects = effects
      .map((entry) => ({
        name: entry.name.trim(),
        description: entry.description.trim(),
      }))
      .filter((entry) => entry.name && entry.description)

    let submittedImage = pendingImageRemoval ? null : toOptionalText(image)
    let uploadedImageUrl = ""
    let hasFreshUpload = false

    if (selectedImageFile) {
      setUploadingImage(true)
      try {
        const uploadPayload = new FormData()
        uploadPayload.append("file", selectedImageFile)

        const uploadResponse = await fetch("/api/uploads/item-image", {
          method: "POST",
          body: uploadPayload,
        })
        const uploadBody = (await uploadResponse.json()) as UploadImagePayload
        if (!uploadResponse.ok || !uploadBody.url) {
          const message = uploadBody.message ?? "Nao foi possivel enviar imagem."
          setUploadError(message)
          setSubmitError(message)
          return
        }

        uploadedImageUrl = uploadBody.url.trim()
        hasFreshUpload = true
        submittedImage = uploadedImageUrl
      } catch {
        setUploadError("Erro de conexao ao enviar imagem.")
        setSubmitError("Erro de conexao ao enviar imagem.")
        return
      } finally {
        setUploadingImage(false)
      }
    }

    const payload = {
      name,
      image: submittedImage,
      description: toOptionalText(description),
      preRequirement: toOptionalText(preRequirement),
      type,
      rarity,
      damage: toOptionalText(damage),
      range: toOptionalText(range),
      abilityName: normalizedAbilities[0]?.name ?? null,
      ability: normalizedAbilities[0]?.description ?? null,
      effectName: normalizedEffects[0]?.name ?? null,
      effect: normalizedEffects[0]?.description ?? null,
      abilities: normalizedAbilities,
      effects: normalizedEffects,
      weight: toOptionalNumber(weight, Number.parseFloat),
      duration: toOptionalText(duration),
      durability: toOptionalNumber(durability, (raw) => Number.parseInt(raw, 10)),
    }

    try {
      const endpoint = isEditing
        ? `/api/rpg/${rpgId}/items/${itemId}`
        : `/api/rpg/${rpgId}/items`
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const responsePayload = (await response.json()) as ApiItemPayload
      if (!response.ok) {
        if (hasFreshUpload && uploadedImageUrl) {
          try {
            await fetch("/api/uploads/item-image", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: uploadedImageUrl }),
            })
          } catch {
            // Nao bloqueia a resposta de erro se a limpeza da imagem falhar.
          }
        }
        setSubmitError(responsePayload.message ?? "Nao foi possivel salvar o item.")
        return
      }

      router.push(`/rpg/${rpgId}/items`)
      router.refresh()
    } catch {
      setSubmitError("Erro de conexao ao salvar o item.")
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }

  function handleImageUpload(file: File) {
    setSelectedImagePreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl)
      }
      return URL.createObjectURL(file)
    })

    setSelectedImageFile(file)
    setPendingImageRemoval(false)
    setUploadError("")
    setSubmitError("")
  }

  function handleRemoveImage() {
    setSelectedImagePreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl)
      }
      return ""
    })
    setSelectedImageFile(null)
    setPendingImageRemoval(image.trim().length > 0)
    setImage("")
    setUploadError("")
    setSubmitError("")
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Itens</p>
          <h1 className={styles.title}>{isEditing ? "Editar item" : "Criar item"}</h1>
          <p className={styles.subtitle}>
            Preencha os dados base e adicione habilidades/efeitos do item.
          </p>
        </div>
        <Link href={`/rpg/${rpgId}/items`} className={styles.backLink}>
          Voltar para itens
        </Link>
      </div>

      {loading ? <p className={styles.feedback}>Carregando item...</p> : null}
      {loadingError ? <p className={styles.error}>{loadingError}</p> : null}

      {!loading && !loadingError ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Nome</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Descricao</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Descricao opcional do item"
              />
            </label>

            <label className={styles.field}>
              <span>Pre-Requisito</span>
              <textarea
                value={preRequirement}
                onChange={(event) => setPreRequirement(event.target.value)}
                rows={3}
                placeholder="Ex: Nivel 10, Forca 15, Classe guerreiro"
              />
            </label>

            <label className={styles.field}>
              <span>Imagem do item</span>
              <div className={styles.imageActions}>
                <label htmlFor="item-image-file" className={styles.ghostButton}>
                  {uploadingImage
                    ? "Enviando..."
                    : selectedImageFile
                      ? "Trocar imagem"
                      : "Adicionar imagem"}
                </label>
                {image || selectedImageFile ? (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={handleRemoveImage}
                    disabled={saving || uploadingImage}
                  >
                    Remover imagem
                  </button>
                ) : null}
              </div>
              <input
                id="item-image-file"
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    handleImageUpload(file)
                  }
                }}
                disabled={saving || uploadingImage}
              />
            </label>

            {selectedImagePreviewUrl || image ? (
              <div className={styles.field}>
                <span>Preview</span>
                <div className={styles.itemImagePreviewFrame}>
                  <Image
                    src={selectedImagePreviewUrl || image}
                    alt={`Imagem de ${name || "item"}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    unoptimized
                    className={styles.itemImagePreview}
                  />
                </div>
              </div>
            ) : null}

            <label className={styles.field}>
              <span>Tipo</span>
              <NativeSelectField
                value={type}
                onChange={(event) => setType(event.target.value as ItemType)}
              >
                {baseItemTypeValues.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelectField>
            </label>

            <label className={styles.field}>
              <span>Raridade</span>
              <NativeSelectField
                value={rarity}
                onChange={(event) => setRarity(event.target.value as ItemRarity)}
              >
                {baseItemRarityValues.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelectField>
            </label>

            <label className={styles.field}>
              <span>Dano (texto)</span>
              <input
                type="text"
                value={damage}
                onChange={(event) => setDamage(event.target.value)}
                placeholder="Ex: 1d6 + 2"
              />
            </label>

            <label className={styles.field}>
              <span>Alcance</span>
              <input
                type="text"
                value={range}
                onChange={(event) => setRange(event.target.value)}
                placeholder="Ex: corpo a corpo, 9m, pessoal"
              />
            </label>

            <label className={styles.field}>
              <span>Peso</span>
              <input
                type="number"
                onWheel={(event) => event.currentTarget.blur()}
                min={0}
                step="0.1"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder="Opcional"
              />
            </label>

            <label className={styles.field}>
              <span>Durabilidade</span>
              <input
                type="number"
                onWheel={(event) => event.currentTarget.blur()}
                min={0}
                step={1}
                value={durability}
                onChange={(event) => setDurability(event.target.value)}
                placeholder="Opcional"
              />
            </label>

            <label className={styles.field}>
              <span>Duracao</span>
              <input
                type="text"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="Ex: 1 turno, 2 rodadas"
              />
            </label>
          </div>

          <div className={styles.multiSection}>
            <h3>Habilidades</h3>
            {abilities.map((ability, index) => (
              <div key={`ability-${index}`} className={styles.multiCard}>
                <label className={styles.field}>
                  <span>Nome da habilidade</span>
                  <input
                    type="text"
                    value={ability.name}
                    onChange={(event) =>
                      setAbilities((prev) => updateAt(prev, index, "name", event.target.value))
                    }
                    placeholder="Opcional"
                  />
                </label>

                <label className={styles.field}>
                  <span>Habilidade</span>
                  <textarea
                    value={ability.description}
                    onChange={(event) =>
                      setAbilities((prev) =>
                        updateAt(prev, index, "description", event.target.value),
                      )
                    }
                    rows={3}
                    placeholder="Descricao da habilidade"
                  />
                </label>

                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() =>
                    setAbilities((prev) =>
                      prev.length === 1 ? [{ name: "", description: "" }] : prev.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remover habilidade
                </button>
              </div>
            ))}

            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => setAbilities((prev) => [...prev, { name: "", description: "" }])}
            >
              Adicionar outra habilidade
            </button>
          </div>

          <div className={styles.multiSection}>
            <h3>Efeitos</h3>
            {effects.map((effect, index) => (
              <div key={`effect-${index}`} className={styles.multiCard}>
                <label className={styles.field}>
                  <span>Nome do efeito</span>
                  <input
                    type="text"
                    value={effect.name}
                    onChange={(event) =>
                      setEffects((prev) => updateAt(prev, index, "name", event.target.value))
                    }
                    placeholder="Opcional"
                  />
                </label>

                <label className={styles.field}>
                  <span>Efeito</span>
                  <textarea
                    value={effect.description}
                    onChange={(event) =>
                      setEffects((prev) =>
                        updateAt(prev, index, "description", event.target.value),
                      )
                    }
                    rows={3}
                    placeholder="Descricao do efeito"
                  />
                </label>

                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() =>
                    setEffects((prev) =>
                      prev.length === 1 ? [{ name: "", description: "" }] : prev.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remover efeito
                </button>
              </div>
            ))}

            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => setEffects((prev) => [...prev, { name: "", description: "" }])}
            >
              Adicionar outro efeito
            </button>
          </div>

          {submitError ? <p className={styles.error}>{submitError}</p> : null}
          {uploadError ? <p className={styles.error}>{uploadError}</p> : null}

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              {saving ? "Salvando..." : isEditing ? "Salvar item" : "Criar item"}
            </button>
            <Link href={`/rpg/${rpgId}/items`} className={styles.ghostButton}>
              Cancelar
            </Link>
          </div>
        </form>
      ) : null}
    </main>
  )
}

