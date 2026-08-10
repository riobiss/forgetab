"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from "react"
import { useRouter } from "next/navigation"
import type { SingleValue } from "react-select"
import { toast } from "react-hot-toast"
import type {
  CharacterEditorBootstrapDto,
  CharacterEditorCharacterTypeDto,
  CharacterEditorTemplateFieldDto,
  CharacterIdentityFieldDto,
  CharacterOptionDto,
  CharactersEditorDependencies,
  UpsertCharacterPayloadDto
} from "@/features/world/characters/application/editor"
import {
  createCharacterUseCase,
  deleteCharacterImageByUrlUseCase,
  deleteCharacterUseCase,
  loadCharacterEditorBootstrapUseCase,
  updateCharacterUseCase,
  uploadCharacterImageUseCase
} from "@/features/world/characters/application/editor"
import {
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
  resolveProgressionTierByCurrent,
  type ProgressionMode,
  type ProgressionTier
} from "@forgetab/world-contracts/rpg/progression"
import { dismissToast } from "@/shared/presentation/notifications/toast"
import { buildCharacterPayload } from "./builders/buildCharacterPayload"
import {
  isIdentityNameField,
  parseNumericInputValue,
  resolveEditTarget,
  type NumericInputValue
} from "./utils"

export type PlayerSelectOption = {
  value: string
  label: string
}

type Params = {
  rpgId: string
  characterId?: string
  deps: CharactersEditorDependencies
  initialBootstrap?: CharacterEditorBootstrapDto | null
  onCompleted?: () => void
  onDeleted?: () => void
}

export function useCharacterEditorController({
  rpgId,
  characterId,
  deps,
  initialBootstrap = null,
  onCompleted,
  onDeleted
}: Params) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [attributes, setAttributes] = useState<
    CharacterEditorTemplateFieldDto[]
  >([])
  const [statuses, setStatuses] = useState<CharacterEditorTemplateFieldDto[]>(
    []
  )
  const [skills, setSkills] = useState<CharacterEditorTemplateFieldDto[]>([])
  const [values, setValues] = useState<Record<string, NumericInputValue>>({})
  const [statusValues, setStatusValues] = useState<
    Record<string, NumericInputValue>
  >({})
  const [skillValues, setSkillValues] = useState<
    Record<string, NumericInputValue>
  >({})
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(
    null
  )
  const [useRaceBonuses, setUseRaceBonuses] = useState(false)
  const [useClassBonuses, setUseClassBonuses] = useState(false)
  const [canManageCharacters, setCanManageCharacters] = useState(false)
  const [useInventoryWeightLimit, setUseInventoryWeightLimit] = useState(false)
  const [progressionMode, setProgressionMode] =
    useState<ProgressionMode>("xp_level")
  const [progressionTiers, setProgressionTiers] = useState<ProgressionTier[]>(
    getDefaultProgressionTiers("xp_level")
  )
  const [progressionCurrent, setProgressionCurrent] = useState("0")
  const [raceTemplates, setRaceTemplates] = useState<CharacterOptionDto[]>([])
  const [classTemplates, setClassTemplates] = useState<CharacterOptionDto[]>([])
  const [assignablePlayers, setAssignablePlayers] = useState<
    CharacterEditorBootstrapDto["assignablePlayers"]
  >([])
  const [identityTemplates, setIdentityTemplates] = useState<
    CharacterIdentityFieldDto[]
  >([])
  const [identityValues, setIdentityValues] = useState<Record<string, string>>(
    {}
  )
  const [characteristicsTemplates, setCharacteristicsTemplates] = useState<
    CharacterIdentityFieldDto[]
  >([])
  const [characteristicsValues, setCharacteristicsValues] = useState<
    Record<string, string>
  >({})
  const [raceKey, setRaceKey] = useState("")
  const [classKey, setClassKey] = useState("")
  const [characterType, setCharacterType] =
    useState<CharacterEditorCharacterTypeDto>("player")
  const [maxCarryWeight, setMaxCarryWeight] = useState("")
  const [characterVisibility, setCharacterVisibility] = useState<
    "private" | "public"
  >("public")
  const [offerToUserId, setOfferToUserId] = useState("")
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

  const assignablePlayerOptions = useMemo(
    () =>
      assignablePlayers.map((player) => ({
        value: player.userId,
        label: `${player.name} (@${player.username})`
      })),
    [assignablePlayers]
  )
  const selectedOfferPlayer =
    assignablePlayerOptions.find((option) => option.value === offerToUserId) ??
    null
  const identityNameField =
    identityTemplates.find((field) => isIdentityNameField(field)) ?? null
  const imageStatusText = useMemo(() => {
    if (selectedImageName.trim()) return selectedImageName
    if (!image.trim()) return ""

    const lastPathSegment = image.split("/").pop() ?? ""
    return lastPathSegment
      ? decodeURIComponent(lastPathSegment)
      : "Imagem atual selecionada"
  }, [image, selectedImageName])
  const normalizedProgressionCurrent = useMemo(() => {
    const parsed = Number(progressionCurrent || 0)
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
  }, [progressionCurrent])
  const resolvedProgressionTier = useMemo(
    () =>
      resolveProgressionTierByCurrent(
        progressionMode,
        progressionTiers,
        normalizedProgressionCurrent
      ),
    [normalizedProgressionCurrent, progressionMode, progressionTiers]
  )

  const applyBootstrap = useCallback(
    (bootstrap: CharacterEditorBootstrapDto) => {
      const editTarget = resolveEditTarget(bootstrap, characterId)
      if (characterId && !editTarget) {
        setError("Personagem nao encontrado para edicao.")
        return
      }

      setAttributes(bootstrap.attributes)
      setStatuses(bootstrap.statuses)
      setSkills(bootstrap.skills)
      setRaceTemplates(bootstrap.races)
      setClassTemplates(bootstrap.classes)
      setIdentityTemplates(bootstrap.identityFields)
      setCharacteristicsTemplates(bootstrap.characteristicFields)
      setAssignablePlayers(bootstrap.assignablePlayers ?? [])

      const legacyClassRaceFlag = Boolean(bootstrap.rpg?.useClassRaceBonuses)
      setUseRaceBonuses(
        typeof bootstrap.rpg?.useRaceBonuses === "boolean"
          ? bootstrap.rpg.useRaceBonuses
          : legacyClassRaceFlag
      )
      setUseClassBonuses(
        typeof bootstrap.rpg?.useClassBonuses === "boolean"
          ? bootstrap.rpg.useClassBonuses
          : legacyClassRaceFlag
      )
      setCanManageCharacters(Boolean(bootstrap.rpg?.canManage))
      setUseInventoryWeightLimit(
        Boolean(bootstrap.rpg?.useInventoryWeightLimit)
      )

      const loadedProgressionMode = isProgressionMode(
        bootstrap.rpg?.progressionMode
      )
        ? bootstrap.rpg.progressionMode
        : "xp_level"
      setProgressionMode(loadedProgressionMode)
      setProgressionTiers(
        normalizeProgressionTiers(
          bootstrap.rpg?.progressionTiers,
          loadedProgressionMode
        )
      )

      const numericValues = (
        template: CharacterEditorTemplateFieldDto[],
        source: Record<string, number> | undefined
      ) =>
        template.reduce<Record<string, NumericInputValue>>((result, item) => {
          result[item.key] = editTarget ? Number(source?.[item.key] ?? 0) : ""
          return result
        }, {})

      setValues(numericValues(bootstrap.attributes, editTarget?.attributes))
      setStatusValues(numericValues(bootstrap.statuses, editTarget?.statuses))
      setSkillValues(numericValues(bootstrap.skills, editTarget?.skills))
      setIdentityValues(
        bootstrap.identityFields.reduce<Record<string, string>>(
          (result, item) => {
            const value = editTarget?.identity?.[item.key]
            result[item.key] =
              typeof value === "string"
                ? value
                : isIdentityNameField(item)
                  ? (editTarget?.name ?? "")
                  : ""
            return result
          },
          {}
        )
      )
      setCharacteristicsValues(
        bootstrap.characteristicFields.reduce<Record<string, string>>(
          (result, item) => {
            const value = editTarget?.characteristics?.[item.key]
            result[item.key] = typeof value === "string" ? value : ""
            return result
          },
          {}
        )
      )
      setName(editTarget?.name ?? "")
      setImage(editTarget?.image ?? "")
      setSelectedImageFile(null)
      setSelectedImageName("")
      setRaceKey(editTarget?.raceKey ?? "")
      setClassKey(editTarget?.classKey ?? "")
      setCharacterType(editTarget?.characterType ?? "player")
      setMaxCarryWeight(
        editTarget?.maxCarryWeight == null
          ? ""
          : String(editTarget.maxCarryWeight)
      )
      setCharacterVisibility(editTarget?.visibility ?? "public")
      setOfferToUserId("")
      setProgressionCurrent(
        typeof editTarget?.progressionCurrent === "number"
          ? String(editTarget.progressionCurrent)
          : "0"
      )
      setEditingCharacterId(editTarget?.id ?? null)
    },
    [characterId]
  )

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        setError("")
        const bootstrap = characterId
          ? await loadCharacterEditorBootstrapUseCase(deps, {
              rpgId,
              includeCharacters: true
            })
          : (initialBootstrap ??
            (await loadCharacterEditorBootstrapUseCase(deps, {
              rpgId,
              includeCharacters: false
            })))
        applyBootstrap(bootstrap)
      } catch {
        setError("Erro de conexao ao carregar padroes de personagem.")
      } finally {
        setLoading(false)
      }
    }

    if (rpgId) void loadTemplate()
  }, [applyBootstrap, characterId, deps, initialBootstrap, rpgId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError("")
    const loadingToastId = toast.loading(
      editingCharacterId ? "Salvando personagem..." : "Criando personagem..."
    )

    try {
      const isEditing = Boolean(editingCharacterId)
      let submittedImage = image
      let uploadedImageUrl = ""
      let hasFreshUpload = false

      if (selectedImageFile) {
        setUploadingImage(true)
        try {
          const upload = await uploadCharacterImageUseCase(deps, {
            file: selectedImageFile
          })
          uploadedImageUrl = upload.url
        } catch (cause) {
          const message =
            cause instanceof Error
              ? cause.message
              : "Nao foi possivel enviar imagem."
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
        offerToUserId
      })

      try {
        if (isEditing && editingCharacterId) {
          await updateCharacterUseCase(deps, {
            rpgId,
            characterId: editingCharacterId,
            payload
          })
        } else {
          await createCharacterUseCase(deps, { rpgId, payload })
        }
      } catch (cause) {
        if (hasFreshUpload && uploadedImageUrl) {
          try {
            await deleteCharacterImageByUrlUseCase(deps, {
              url: uploadedImageUrl
            })
          } catch {
            // A falha na limpeza nao substitui o erro original.
          }
        }
        setError(
          cause instanceof Error
            ? cause.message
            : isEditing
              ? "Nao foi possivel atualizar personagem."
              : "Nao foi possivel criar personagem."
        )
        return
      }

      setSelectedImageFile(null)
      setSelectedImageName("")
      toast.success(
        editingCharacterId
          ? "Personagem salvo com sucesso."
          : "Personagem criado com sucesso."
      )
      if (onCompleted) {
        onCompleted()
      } else {
        router.push(`/rpg/${rpgId}/characters`)
        router.refresh()
      }
    } catch {
      const message = editingCharacterId
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

  const updateNumericValue = (
    setter: typeof setValues,
    key: string,
    value: string
  ) =>
    setter((current) => ({ ...current, [key]: parseNumericInputValue(value) }))

  function handleImageUpload(file: File) {
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

  function handleOfferPlayerChange(option: SingleValue<PlayerSelectOption>) {
    setOfferToUserId(option?.value ?? "")
  }

  async function handleDeleteCharacter() {
    if (!editingCharacterId || deletingRef.current) return
    deletingRef.current = true
    setDeleting(true)
    setError("")
    const loadingToastId = toast.loading("Deletando personagem...")

    try {
      await deleteCharacterUseCase(deps, {
        rpgId,
        characterId: editingCharacterId
      })
      toast.success("Personagem deletado com sucesso.")
      if (onDeleted) {
        onDeleted()
      } else {
        router.push(`/rpg/${rpgId}/characters`)
        router.refresh()
      }
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Erro de conexao ao deletar personagem."
      setError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setDeleting(false)
      setShowDeleteConfirm(false)
      deletingRef.current = false
    }
  }

  return {
    name,
    image,
    attributes,
    statuses,
    skills,
    values,
    statusValues,
    skillValues,
    editingCharacterId,
    useRaceBonuses,
    useClassBonuses,
    canManageCharacters,
    useInventoryWeightLimit,
    progressionMode,
    progressionCurrent,
    raceTemplates,
    classTemplates,
    identityTemplates,
    identityValues,
    characteristicsTemplates,
    characteristicsValues,
    raceKey,
    classKey,
    characterType,
    maxCarryWeight,
    characterVisibility,
    loading,
    saving,
    deleting,
    showDeleteConfirm,
    uploadingImage,
    uploadError,
    error,
    showStatusSection,
    showAttributeSection,
    showSkillSection,
    assignablePlayerOptions,
    selectedOfferPlayer,
    identityNameField,
    imageStatusText,
    resolvedProgressionTier,
    setName,
    setRaceKey,
    setClassKey,
    setCharacterType,
    setMaxCarryWeight,
    setCharacterVisibility,
    setShowDeleteConfirm,
    setShowStatusSection,
    setShowAttributeSection,
    setShowSkillSection,
    updateAttribute: (key: string, value: string) =>
      updateNumericValue(setValues, key, value),
    updateStatus: (key: string, value: string) =>
      updateNumericValue(setStatusValues, key, value),
    updateSkill: (key: string, value: string) =>
      updateNumericValue(setSkillValues, key, value),
    updateIdentityField: (key: string, value: string) =>
      setIdentityValues((current) => ({ ...current, [key]: value })),
    updateCharacteristicsField: (key: string, value: string) =>
      setCharacteristicsValues((current) => ({ ...current, [key]: value })),
    handleSubmit,
    handleImageUpload,
    handleRemoveImage,
    handleOfferPlayerChange,
    handleDeleteCharacter
  }
}
