"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import type {
  CharacterEditorBootstrapDto,
  CharacterEditorCharacterTypeDto,
  CharacterEditorTemplateFieldDto,
  CharacterIdentityFieldDto,
  CharacterOptionDto,
  CharactersEditorDependencies,
  UpsertCharacterPayloadDto,
} from "@/application/characters/editor"
import {
  createCharacterUseCase,
  deleteCharacterImageByUrlUseCase,
  deleteCharacterUseCase,
  loadCharacterEditorBootstrapUseCase,
  updateCharacterUseCase,
  uploadCharacterImageUseCase,
} from "@/application/characters/editor"
import styles from "./CharacterEditorForm.module.css"
import {
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
  resolveProgressionTierByCurrent,
  type ProgressionMode,
  type ProgressionTier,
} from "@/lib/rpg/progression"
import { dismissToast } from "@/lib/toast"
import {
  CharacterEditorActions,
  CharacterEditorIdentitySection,
  CharacterEditorNumericSection,
  CharacterEditorTextSection,
} from "./components"
import { buildCharacterPayload } from "./builders/buildCharacterPayload"
import {
  type NumericInputValue,
  isIdentityNameField,
  parseNumericInputValue,
  resolveEditTarget,
} from "./utils"

type CharacterEditorFormProps = {
  rpgId: string
  characterId?: string
  deps: CharactersEditorDependencies
  initialBootstrap?: CharacterEditorBootstrapDto | null
  presentation?: "page" | "embedded"
  onCompleted?: () => void
  onDeleted?: () => void
  onCancel?: () => void
}

export default function CharacterEditorForm({
  rpgId,
  characterId,
  deps,
  initialBootstrap = null,
  presentation = "page",
  onCompleted,
  onDeleted,
  onCancel,
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

  function applyBootstrap(bootstrap: CharacterEditorBootstrapDto) {
    const attributeTemplate = bootstrap.attributes
    const statusTemplate = bootstrap.statuses
    const skillTemplate = bootstrap.skills
    const races = bootstrap.races
    const classes = bootstrap.classes
    const identityFields = bootstrap.identityFields
    const characteristicsFields = bootstrap.characteristicFields
    const editTarget = resolveEditTarget(bootstrap, characterId)

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
  }

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        setError("")
        const bootstrap =
          characterId
            ? await loadCharacterEditorBootstrapUseCase(deps, {
                rpgId,
                includeCharacters: true,
              })
            : initialBootstrap ??
              (await loadCharacterEditorBootstrapUseCase(deps, {
                rpgId,
                includeCharacters: false,
              }))
        applyBootstrap(bootstrap)
      } catch {
        setError("Erro de conexao ao carregar padroes de personagem.")
      } finally {
        setLoading(false)
      }
    }

    if (rpgId) {
      void loadTemplate()
    }
  }, [characterId, deps, initialBootstrap, rpgId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    savingRef.current = true

    setSaving(true)
    setError("")
    const loadingToastId = toast.loading(editingCharacterId ? "Salvando personagem..." : "Criando personagem...")

    try {
      const isEditing = Boolean(editingCharacterId)
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
          toast.error(message)
          return
        }
        submittedImage = uploadedImageUrl
        hasFreshUpload = true
      }

      const payload: UpsertCharacterPayloadDto = buildCharacterPayload({
        editingCharacterId,
        canManageCharacters,
        useRaceBonuses,
        useClassBonuses,
        useInventoryWeightLimit,
        raceKey,
        classKey,
        characterType,
        maxCarryWeight,
        characterVisibility,
        progressionCurrent,
        image: submittedImage,
        name,
        identityNameFieldKey: identityNameField?.key ?? null,
        identityValues,
        characteristicsValues,
        statusValues,
        attributeValues: values,
        skillValues,
      })

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
      toast.success(editingCharacterId ? "Personagem salvo com sucesso." : "Personagem criado com sucesso.")
      if (onCompleted) {
        onCompleted()
      } else {
        router.push(`/rpg/${rpgId}/characters`)
        router.refresh()
      }
    } catch {
      const message =
        editingCharacterId
          ? "Erro de conexao ao atualizar personagem."
          : "Erro de conexao ao criar personagem."
      setError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
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
    const loadingToastId = toast.loading("Deletando personagem...")

    try {
      await deleteCharacterUseCase(deps, { rpgId, characterId: editingCharacterId })
      toast.success("Personagem deletado com sucesso.")
      if (onDeleted) {
        onDeleted()
      } else {
        router.push(`/rpg/${rpgId}/characters`)
        router.refresh()
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro de conexao ao deletar personagem."
      setError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setDeleting(false)
      setShowDeleteConfirm(false)
      deletingRef.current = false
    }
  }

  const content = (
    <form className={styles.form} onSubmit={handleSubmit}>
      <CharacterEditorIdentitySection
        identityNameField={identityNameField}
        name={name}
        image={image}
        imageStatusText={imageStatusText}
        uploadingImage={uploadingImage}
        uploadError={uploadError}
        useRaceBonuses={useRaceBonuses}
        useClassBonuses={useClassBonuses}
        useInventoryWeightLimit={useInventoryWeightLimit}
        editingCharacterId={editingCharacterId}
        canManageCharacters={canManageCharacters}
        raceTemplates={raceTemplates}
        classTemplates={classTemplates}
        raceKey={raceKey}
        classKey={classKey}
        characterType={characterType}
        resolvedProgressionTier={resolvedProgressionTier}
        progressionMode={progressionMode}
        progressionCurrent={progressionCurrent}
        maxCarryWeight={maxCarryWeight}
        characterVisibility={characterVisibility}
        identityTemplates={identityTemplates}
        identityValues={identityValues}
        saving={saving}
        deleting={deleting}
        onNameChange={setName}
        onImageSelect={(file) => void handleImageUpload(file)}
        onImageRemove={handleRemoveImage}
        onRaceChange={setRaceKey}
        onClassChange={setClassKey}
        onCharacterTypeChange={setCharacterType}
        onMaxCarryWeightChange={setMaxCarryWeight}
        onVisibilityChange={setCharacterVisibility}
        onIdentityFieldChange={updateIdentityField}
      />

      <CharacterEditorTextSection
        title="Caracteristicas"
        fields={characteristicsTemplates}
        values={characteristicsValues}
        onFieldChange={updateCharacteristicsField}
      />

      <CharacterEditorNumericSection
        title="Status"
        items={statuses}
        values={statusValues}
        visible={showStatusSection}
        keyPrefix="character-status"
        min={0}
        onToggle={() => setShowStatusSection((prev) => !prev)}
        onChange={updateStatus}
      />

      <CharacterEditorNumericSection
        title="Atributos"
        items={attributes}
        values={values}
        visible={showAttributeSection}
        keyPrefix="character-attribute"
        onToggle={() => setShowAttributeSection((prev) => !prev)}
        onChange={updateAttribute}
      />

      {skills.length > 0 && (!editingCharacterId || canManageCharacters) ? (
        <CharacterEditorNumericSection
          title="Pericias"
          items={skills}
          values={skillValues}
          visible={showSkillSection}
          keyPrefix="character-skill"
          min={0}
          onToggle={() => setShowSkillSection((prev) => !prev)}
          onChange={updateSkill}
        />
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      <CharacterEditorActions
        rpgId={rpgId}
        editingCharacterId={editingCharacterId}
        saving={saving}
        deleting={deleting}
        canSubmit={!saving && attributes.length > 0 && statuses.length > 0}
        showDeleteConfirm={showDeleteConfirm}
        onCancel={onCancel}
        onDeleteRequest={() => setShowDeleteConfirm(true)}
        onDeleteConfirm={() => void handleDeleteCharacter()}
        onDeleteCancel={() => setShowDeleteConfirm(false)}
      />
    </form>
  )

  if (loading) {
    if (presentation === "embedded") {
      return <p>Carregando padrao de atributos...</p>
    }

    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p>Carregando padrao de atributos...</p>
        </section>
      </main>
    )
  }

  if (presentation === "embedded") {
    return content
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        {content}
      </section>
    </main>
  )
}

