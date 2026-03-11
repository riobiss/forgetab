"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ImagePlus, Paperclip, Trash2 } from "lucide-react"
import type { CharactersEditorDependencies } from "@/application/charactersEditor/contracts/CharactersEditorDependencies"
import type {
  CharacterEditorCharacterTypeDto,
  CharacterEditorTemplateFieldDto,
  CharacterIdentityFieldDto,
  CharacterOptionDto,
  UpsertCharacterPayloadDto,
} from "@/application/charactersEditor/types"
import {
  createCharacterUseCase,
  deleteCharacterImageByUrlUseCase,
  deleteCharacterUseCase,
  loadCharacterEditorBootstrapUseCase,
  updateCharacterUseCase,
  uploadCharacterImageUseCase,
} from "@/application/charactersEditor/use-cases/charactersEditor"
import styles from "./CharacterEditorForm.module.css"
import NumericTemplateGrid from "@/components/rpg/NumericTemplateGrid"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import {
  getDefaultProgressionTiers,
  getProgressionModeLabel,
  isProgressionMode,
  normalizeProgressionTiers,
  resolveProgressionTierByCurrent,
  type ProgressionMode,
  type ProgressionTier,
} from "@/lib/rpg/progression"

type NumericInputValue = number | ""

function parseNumericInputValue(value: string): NumericInputValue {
  if (value === "") {
    return ""
  }

  return Number(value)
}

function normalizeNumericValues(values: Record<string, NumericInputValue>) {
  return Object.entries(values).reduce<Record<string, number>>((acc, [key, value]) => {
    acc[key] = value === "" ? 0 : value
    return acc
  }, {})
}

function isIdentityNameField(field: CharacterIdentityFieldDto) {
  const normalizedLabel = field.label.trim().toLowerCase()
  return (
    field.key === "nome" ||
    field.key === "name" ||
    normalizedLabel === "nome" ||
    normalizedLabel === "name"
  )
}

const CHARACTER_TYPE_LABEL: Record<CharacterEditorCharacterTypeDto, string> = {
  player: "Player",
  npc: "NPC",
  monster: "Monstro",
}

type CharacterEditorFormProps = {
  rpgId: string
  characterId?: string
  deps: CharactersEditorDependencies
}

export default function CharacterEditorForm({
  rpgId,
  characterId,
  deps,
}: CharacterEditorFormProps) {
  const router = useRouter()

  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [attributes, setAttributes] = useState<CharacterEditorTemplateFieldDto[]>([])
  const [statuses, setStatuses] = useState<CharacterEditorTemplateFieldDto[]>([])
  const [skills, setSkills] = useState<CharacterEditorTemplateFieldDto[]>([])
  const [values, setValues] = useState<Record<string, NumericInputValue>>({})
  const [statusValues, setStatusValues] = useState<Record<string, NumericInputValue>>({})
  const [skillValues, setSkillValues] = useState<Record<string, NumericInputValue>>({})
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null)
  const [useRaceBonuses, setUseRaceBonuses] = useState(false)
  const [useClassBonuses, setUseClassBonuses] = useState(false)
  const [canManageCharacters, setCanManageCharacters] = useState(false)
  const [useInventoryWeightLimit, setUseInventoryWeightLimit] = useState(false)
  const [progressionMode, setProgressionMode] = useState<ProgressionMode>("xp_level")
  const [progressionTiers, setProgressionTiers] = useState<ProgressionTier[]>(
    getDefaultProgressionTiers("xp_level"),
  )
  const [progressionCurrent, setProgressionCurrent] = useState("0")
  const [raceTemplates, setRaceTemplates] = useState<CharacterOptionDto[]>([])
  const [classTemplates, setClassTemplates] = useState<CharacterOptionDto[]>([])
  const [identityTemplates, setIdentityTemplates] = useState<CharacterIdentityFieldDto[]>([])
  const [identityValues, setIdentityValues] = useState<Record<string, string>>({})
  const [characteristicsTemplates, setCharacteristicsTemplates] = useState<CharacterIdentityFieldDto[]>([])
  const [characteristicsValues, setCharacteristicsValues] = useState<Record<string, string>>({})
  const [raceKey, setRaceKey] = useState("")
  const [classKey, setClassKey] = useState("")
  const [characterType, setCharacterType] = useState<CharacterEditorCharacterTypeDto>(
    "player",
  )
  const [maxCarryWeight, setMaxCarryWeight] = useState("")
  const [characterVisibility, setCharacterVisibility] = useState<"private" | "public">(
    "public",
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [error, setError] = useState("")
  const [showStatusSection, setShowStatusSection] = useState(true)
  const [showAttributeSection, setShowAttributeSection] = useState(true)
  const [showSkillSection, setShowSkillSection] = useState(true)
  const [selectedImageName, setSelectedImageName] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const savingRef = useRef(false)
  const deletingRef = useRef(false)
  const identityNameField = identityTemplates.find((field) => isIdentityNameField(field)) ?? null
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
  const normalizedProgressionCurrent = useMemo(() => {
    const parsed = Number(progressionCurrent || 0)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0
    }
    return Math.floor(parsed)
  }, [progressionCurrent])
  const resolvedProgressionTier = useMemo(
    () =>
      resolveProgressionTierByCurrent(
        progressionMode,
        progressionTiers,
        normalizedProgressionCurrent,
      ),
    [normalizedProgressionCurrent, progressionMode, progressionTiers],
  )

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        setError("")
        const bootstrap = await loadCharacterEditorBootstrapUseCase(deps, { rpgId })
        const attributeTemplate = bootstrap.attributes
        const statusTemplate = bootstrap.statuses
        const skillTemplate = bootstrap.skills
        const races = bootstrap.races
        const classes = bootstrap.classes
        const identityFields = bootstrap.identityFields
        const characteristicsFields = bootstrap.characteristicFields
        const allCharacters = bootstrap.characters
        const editTarget = characterId
          ? allCharacters.find((character) => character.id === characterId)
          : null

        if (characterId && !editTarget) {
          setError("Personagem nao encontrado para edicao.")
          return
        }

        setAttributes(attributeTemplate)
        setStatuses(statusTemplate)
        setSkills(skillTemplate)
        setRaceTemplates(races)
        setClassTemplates(classes)
        setIdentityTemplates(identityFields)
        setCharacteristicsTemplates(characteristicsFields)
        const legacyClassRaceFlag = Boolean(bootstrap.rpg?.useClassRaceBonuses)
        setUseRaceBonuses(
          typeof bootstrap.rpg?.useRaceBonuses === "boolean"
            ? bootstrap.rpg.useRaceBonuses
            : legacyClassRaceFlag,
        )
        setUseClassBonuses(
          typeof bootstrap.rpg?.useClassBonuses === "boolean"
            ? bootstrap.rpg.useClassBonuses
            : legacyClassRaceFlag,
        )
        setCanManageCharacters(Boolean(bootstrap.rpg?.canManage))
        setUseInventoryWeightLimit(Boolean(bootstrap.rpg?.useInventoryWeightLimit))
        const loadedProgressionMode = isProgressionMode(bootstrap.rpg?.progressionMode)
          ? bootstrap.rpg.progressionMode
          : ("xp_level" as ProgressionMode)
        const loadedProgressionTiers = normalizeProgressionTiers(
          bootstrap.rpg?.progressionTiers,
          loadedProgressionMode,
        )
        setProgressionMode(loadedProgressionMode)
        setProgressionTiers(loadedProgressionTiers)

        const nextAttributes = attributeTemplate.reduce<Record<string, NumericInputValue>>((acc, item) => {
          const value = (editTarget?.attributes ?? {})[item.key]
          acc[item.key] = editTarget ? Number(value ?? 0) : ""
          return acc
        }, {})

        const nextStatuses = statusTemplate.reduce<Record<string, NumericInputValue>>((acc, item) => {
          const value = (editTarget?.statuses ?? {})[item.key]
          acc[item.key] = editTarget ? Number(value ?? 0) : ""
          return acc
        }, {})
        const nextSkills = skillTemplate.reduce<Record<string, NumericInputValue>>((acc, item) => {
          const value = (editTarget?.skills ?? {})[item.key]
          acc[item.key] = editTarget ? Number(value ?? 0) : ""
          return acc
        }, {})
        const nextIdentity = identityFields.reduce<Record<string, string>>((acc, item) => {
          const value = editTarget?.identity?.[item.key]
          acc[item.key] =
            typeof value === "string"
              ? value
              : isIdentityNameField(item)
                ? (editTarget?.name ?? "")
                : ""
          return acc
        }, {})
        const nextCharacteristics = characteristicsFields.reduce<Record<string, string>>((acc, item) => {
          const value = editTarget?.characteristics?.[item.key]
          acc[item.key] = typeof value === "string" ? value : ""
          return acc
        }, {})

        setValues(nextAttributes)
        setStatusValues(nextStatuses)
        setSkillValues(nextSkills)
        setIdentityValues(nextIdentity)
        setCharacteristicsValues(nextCharacteristics)
        setName(editTarget?.name ?? "")
        setImage(editTarget?.image ?? "")
        setSelectedImageFile(null)
        setSelectedImageName("")
        setRaceKey(editTarget?.raceKey ?? "")
        setClassKey(editTarget?.classKey ?? "")
        setCharacterType(editTarget?.characterType ?? "player")
        setMaxCarryWeight(
          editTarget?.maxCarryWeight === null || editTarget?.maxCarryWeight === undefined
            ? ""
            : String(editTarget.maxCarryWeight),
        )
        setCharacterVisibility(editTarget?.visibility ?? "public")
        setProgressionCurrent(
          typeof editTarget?.progressionCurrent === "number"
            ? String(editTarget.progressionCurrent)
            : "0",
        )
        setEditingCharacterId(editTarget?.id ?? null)
      } catch {
        setError("Erro de conexao ao carregar padroes de personagem.")
      } finally {
        setLoading(false)
      }
    }

    if (rpgId) {
      void loadTemplate()
    }
  }, [characterId, deps, rpgId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    savingRef.current = true

    setSaving(true)
    setError("")

    try {
      const isEditing = Boolean(editingCharacterId)
      const resolvedName = identityNameField
        ? (identityValues[identityNameField.key] ?? "").trim()
        : name.trim()
      const parsedMaxCarryWeight =
        useInventoryWeightLimit && characterType === "player"
          ? maxCarryWeight.trim() === ""
            ? null
            : Number(maxCarryWeight)
          : null
      const parsedProgressionCurrent = Number(progressionCurrent || 0)
      let submittedImage = image
      let uploadedImageUrl = ""
      let hasFreshUpload = false

      if (selectedImageFile) {
        setUploadingImage(true)
        try {
          const upload = await uploadCharacterImageUseCase(deps, { file: selectedImageFile })
          uploadedImageUrl = upload.url
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : "Nao foi possivel enviar imagem."
          setUploadError(message)
          setError(message)
          return
        }
        submittedImage = uploadedImageUrl
        hasFreshUpload = true
      }

      const payload: UpsertCharacterPayloadDto = {
        name: resolvedName,
        image: submittedImage,
        ...(isEditing
          ? canManageCharacters
            ? {
              ...(useRaceBonuses ? { raceKey } : {}),
              ...(useClassBonuses ? { classKey } : {}),
            }
            : {}
          : {
            ...(useRaceBonuses && raceKey ? { raceKey } : {}),
            ...(useClassBonuses && classKey ? { classKey } : {}),
          }),
        ...(isEditing ? {} : { characterType }),
        ...(useInventoryWeightLimit && characterType === "player"
          ? { maxCarryWeight: parsedMaxCarryWeight }
          : {}),
        ...(isEditing ? { visibility: characterVisibility } : {}),
        progressionCurrent: isEditing
          ? Number.isFinite(parsedProgressionCurrent)
            ? Math.max(0, Math.floor(parsedProgressionCurrent))
            : 0
          : 0,
        statuses: normalizeNumericValues(statusValues),
        attributes: normalizeNumericValues(values),
        identity: identityValues,
        characteristics: characteristicsValues,
        ...(!isEditing || canManageCharacters
          ? { skills: normalizeNumericValues(skillValues) }
          : {}),
      }

      try {
        if (isEditing && editingCharacterId) {
          await updateCharacterUseCase(deps, {
            rpgId,
            characterId: editingCharacterId,
            payload,
          })
        } else {
          await createCharacterUseCase(deps, { rpgId, payload })
        }
      } catch (cause) {
        if (hasFreshUpload && uploadedImageUrl) {
          try {
            await deleteCharacterImageByUrlUseCase(deps, { url: uploadedImageUrl })
          } catch {
            // Nao bloqueia a resposta de erro se a limpeza da imagem falhar.
          }
        }
        setError(
          cause instanceof Error
            ? cause.message
            : isEditing
              ? "Nao foi possivel atualizar personagem."
              : "Nao foi possivel criar personagem.",
        )
        return
      }

      setSelectedImageFile(null)
      setSelectedImageName("")
      router.push(`/rpg/${rpgId}/characters`)
      router.refresh()
    } catch {
      setError(
        editingCharacterId
          ? "Erro de conexao ao atualizar personagem."
          : "Erro de conexao ao criar personagem.",
      )
    } finally {
      setUploadingImage(false)
      setSaving(false)
      savingRef.current = false
    }
  }

  function updateAttribute(key: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [key]: parseNumericInputValue(value),
    }))
  }

  function updateStatus(key: string, value: string) {
    setStatusValues((prev) => ({
      ...prev,
      [key]: parseNumericInputValue(value),
    }))
  }

  function updateSkill(key: string, value: string) {
    setSkillValues((prev) => ({
      ...prev,
      [key]: parseNumericInputValue(value),
    }))
  }

  function updateIdentityField(key: string, value: string) {
    setIdentityValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  function updateCharacteristicsField(key: string, value: string) {
    setCharacteristicsValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function handleImageUpload(file: File) {
    setSelectedImageFile(file)
    setUploadError("")
    setError("")
    setSelectedImageName(file.name)
  }

  function handleRemoveImage() {
    setSelectedImageFile(null)
    setImage("")
    setSelectedImageName("")
    setUploadError("")
  }

  async function handleDeleteCharacter() {
    if (!editingCharacterId) return
    if (deletingRef.current) return

    deletingRef.current = true
    setDeleting(true)
    setError("")

    try {
      await deleteCharacterUseCase(deps, { rpgId, characterId: editingCharacterId })
      router.push(`/rpg/${rpgId}/characters`)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro de conexao ao deletar personagem.")
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
      deletingRef.current = false
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p>Carregando padrao de atributos...</p>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <div>
            <h1>{editingCharacterId ? "Editar Personagem" : "Criar Personagem"}</h1>
            <p>Preencha os campos da ficha com os valores definidos no RPG.</p>
          </div>
          <div className={styles.badges}>
            <span>{statuses.length} status</span>
            <span>{attributes.length} atributos</span>
            <span>{skills.length} pericias</span>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.section}>
            <h2>Identificacao</h2>
            <div className={styles.identityGrid}>
              {!identityNameField ? (
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
              ) : null}

              <div className={styles.field}>
                <span>
                  <Paperclip size={14} />
                  Imagem do personagem
                </span>
                <div className={styles.fileUploadActions}>
                  <label htmlFor="character-image-file" className={styles.fileUploadTrigger}>
                    <ImagePlus size={16} />
                    <span>Selecionar imagem</span>
                  </label>
                  {image ? (
                    <button
                      type="button"
                      className={styles.fileRemoveButton}
                      onClick={handleRemoveImage}
                      disabled={saving || deleting || uploadingImage}
                      aria-label="Remover imagem"
                      title="Remover imagem"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
                <input
                  id="character-image-file"
                  className={styles.fileUploadInput}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void handleImageUpload(file)
                    }
                  }}
                />
                {imageStatusText ? <p className={styles.fileUploadStatus}>{imageStatusText}</p> : null}
              </div>
              {uploadingImage ? <p>Enviando imagem...</p> : null}
              {uploadError ? <p className={styles.error}>{uploadError}</p> : null}

              {useRaceBonuses && raceTemplates.length > 0 ? (
                <label className={styles.field}>
                  <span>Raca</span>
                  {editingCharacterId && !canManageCharacters ? (
                    <input
                      type="text"
                      value={
                        raceTemplates.find((item) => item.key === raceKey)?.label ??
                        "Sem raca"
                      }
                      readOnly
                    />
                  ) : (
                    <NativeSelectField
                      value={raceKey}
                      onChange={(event) => setRaceKey(event.target.value)}
                    >
                      <option value="">Sem raca</option>
                      {raceTemplates.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </NativeSelectField>
                  )}
                </label>
              ) : null}

              {useClassBonuses && classTemplates.length > 0 ? (
                <label className={styles.field}>
                  <span>Classe</span>
                  {editingCharacterId && !canManageCharacters ? (
                    <input
                      type="text"
                      value={
                        classTemplates.find((item) => item.key === classKey)?.label ??
                        "Sem classe"
                      }
                      readOnly
                    />
                  ) : (
                    <NativeSelectField
                      value={classKey}
                      onChange={(event) => setClassKey(event.target.value)}
                    >
                      <option value="">Sem classe</option>
                      {classTemplates.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </NativeSelectField>
                  )}
                </label>
              ) : null}

              <label className={styles.field}>
                <span>Tipo</span>
                {editingCharacterId ? (
                  <input type="text" value={CHARACTER_TYPE_LABEL[characterType]} readOnly />
                ) : (
                  <NativeSelectField
                    value={characterType}
                    onChange={(event) =>
                      setCharacterType(
                        event.target.value as CharacterEditorCharacterTypeDto,
                      )
                    }
                  >
                    <option value="player">Player</option>
                    <option value="npc">NPC</option>
                    <option value="monster">Monstro</option>
                  </NativeSelectField>
                )}
              </label>

              <label className={styles.field}>
                <span>Nivel atual ({getProgressionModeLabel(progressionMode)})</span>
                <input
                  type="text"
                  readOnly
                  value={`${resolvedProgressionTier.label} (requisito ${resolvedProgressionTier.required})`}
                />
              </label>

              <label className={styles.field}>
                <span>XP atual</span>
                <input
                  type="number"
                  onWheel={(event) => event.currentTarget.blur()}
                  min={0}
                  value={progressionCurrent}
                  readOnly
                />
              </label>

              {useInventoryWeightLimit && characterType === "player" ? (
                <label className={styles.field}>
                  <span>Peso maximo (kg)</span>
                  <input
                    type="number"
                    onWheel={(event) => event.currentTarget.blur()}
                    min={0}
                    step="0.1"
                    value={maxCarryWeight}
                    onChange={(event) => setMaxCarryWeight(event.target.value)}
                    placeholder="Ex.: 30"
                    required
                  />
                </label>
              ) : null}

              {editingCharacterId ? (
                <div className={styles.field}>
                  <span>Visibilidade</span>
                  <div className={styles.visibilityOptions}>
                    <button
                      type="button"
                      className={
                        characterVisibility === "public"
                          ? `${styles.visibilityOption} ${styles.visibilityOptionActive}`
                          : styles.visibilityOption
                      }
                      onClick={() => setCharacterVisibility("public")}
                    >
                      Publico
                    </button>
                    <button
                      type="button"
                      className={
                        characterVisibility === "private"
                          ? `${styles.visibilityOption} ${styles.visibilityOptionActive}`
                          : styles.visibilityOption
                      }
                      onClick={() => setCharacterVisibility("private")}
                    >
                      Privado
                    </button>
                  </div>
                </div>
              ) : null}

              {identityTemplates.map((field) => (
                <label className={styles.field} key={`identity-${field.key}`}>
                  <span>{field.label}</span>
                  <input
                    type="text"
                    value={identityValues[field.key] ?? ""}
                    onChange={(event) => updateIdentityField(field.key, event.target.value)}
                    required={field.required}
                  />
                </label>
              ))}

            </div>
          </section>

          {characteristicsTemplates.length > 0 ? (
            <section className={styles.section}>
              <h2>Caracteristicas</h2>
              <div className={styles.identityGrid}>
                {characteristicsTemplates.map((field) => (
                  <label className={styles.field} key={`characteristics-${field.key}`}>
                    <span>{field.label}</span>
                    <input
                      type="text"
                      value={characteristicsValues[field.key] ?? ""}
                      onChange={(event) => updateCharacteristicsField(field.key, event.target.value)}
                      required={field.required}
                    />
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Status</h2>
              <button
                type="button"
                className={styles.sectionToggleButton}
                onClick={() => setShowStatusSection((prev) => !prev)}
              >
                {showStatusSection ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {showStatusSection ? (
              <NumericTemplateGrid
                items={statuses.map((status) => ({
                  key: status.key,
                  label: status.label,
                }))}
                values={statusValues}
                onChange={updateStatus}
                gridClassName={styles.valuesGrid}
                fieldClassName={styles.field}
                keyPrefix="character-status"
                min={0}
              />
            ) : null}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Atributos</h2>
              <button
                type="button"
                className={styles.sectionToggleButton}
                onClick={() => setShowAttributeSection((prev) => !prev)}
              >
                {showAttributeSection ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {showAttributeSection ? (
              <NumericTemplateGrid
                items={attributes.map((attribute) => ({
                  key: attribute.key,
                  label: attribute.label,
                }))}
                values={values}
                onChange={updateAttribute}
                gridClassName={styles.valuesGrid}
                fieldClassName={styles.field}
                keyPrefix="character-attribute"
              />
            ) : null}
          </section>

          {skills.length > 0 && (!editingCharacterId || canManageCharacters) ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Pericias</h2>
                <button
                  type="button"
                  className={styles.sectionToggleButton}
                  onClick={() => setShowSkillSection((prev) => !prev)}
                >
                  {showSkillSection ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {showSkillSection ? (
                <>
                  <NumericTemplateGrid
                    items={skills.map((skill) => ({
                      key: skill.key,
                      label: skill.label,
                    }))}
                    values={skillValues}
                    onChange={updateSkill}
                    gridClassName={styles.valuesGrid}
                    fieldClassName={styles.field}
                    keyPrefix="character-skill"
                    min={0}
                  />
                </>
              ) : null}
            </section>
          ) : null}

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={
                saving ||
                attributes.length === 0 ||
                statuses.length === 0
              }
            >
              {saving
                ? editingCharacterId
                  ? "Salvando..."
                  : "Criando..."
                : editingCharacterId
                  ? "Salvar personagem"
                  : "Criar personagem"}
            </button>
            <Link href={`/rpg/${rpgId}/characters`}>Cancelar</Link>
            {editingCharacterId ? (
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving || deleting}
              >
                Deletar personagem
              </button>
            ) : null}
          </div>

          {editingCharacterId && showDeleteConfirm ? (
            <div className={styles.deleteNotice}>
              <p>Tem certeza que deseja deletar este personagem?</p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => void handleDeleteCharacter()}
                  disabled={deleting}
                >
                  {deleting ? "Deletando..." : "Confirmar exclusao"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}
        </form>
      </section>
    </main>
  )
}

