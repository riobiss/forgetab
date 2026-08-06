"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { toast } from "react-hot-toast"
import {
  type UpdateCharacterPayloadDto,
  type CharacterEditorBootstrapDto,
  type CharacterEditorSummaryDto,
  type UpsertCharacterPayloadDto,
  createCharacterUseCase,
  deleteCharacterUseCase,
  deleteCharacterImageByUrlUseCase,
  loadCharacterEditorBootstrapUseCase,
  loadEditableCharacterUseCase,
  updateCharacterUseCase,
  uploadCharacterImageUseCase
} from "@/features/world/characters/application/editor"
import {
  buildNpcMonsterBasicUpdatePayload,
  buildNpcMonsterBonusUpdatePayload,
  buildNpcMonsterCreatePayload
} from "@/features/world/characters/application/npc-monster"
import { createCharactersEditorDependencies } from "@/features/world/characters/presentation/editor/dependencies"
import styles from "../CharactersDashboardPage.module.css"
import { npcMonsterSteps } from "./npc-monster-modal/constants"
import {
  NpcMonsterAbilitiesStep,
  NpcMonsterBasicStep,
  NpcMonsterBonusStep,
  NpcMonsterExtraFieldModal,
  NpcMonsterInventoryStep,
  NpcMonsterPickerModal
} from "./npc-monster-modal/components"
import {
  ExtraField,
  NarrativeStatus,
  NumericInputValue,
  SecretFieldKey,
  StepKey
} from "./npc-monster-modal/types"
import {
  applyCharacterSnapshot,
  createEmptyExtraField,
  parseNumericInputValue
} from "./npc-monster-modal/utils"
import {
  buildNpcMonsterFormState,
  buildNpcMonsterSecretFieldOptions,
  getNpcMonsterImageStatusText
} from "./npc-monster-modal/presentation"
import { useNpcMonsterLoadout } from "./npc-monster-modal/hooks/useNpcMonsterLoadout"
import {
  mergeCharacterSnapshot,
  upsertCharacterSnapshot
} from "./npc-monster-modal/characterSnapshot"

type Props = {
  rpgId: string
  isOpen: boolean
  mode: "create" | "edit"
  characterType: "npc" | "monster"
  characterId?: string | null
  initialBootstrap?: CharacterEditorBootstrapDto | null
  onClose: () => void
}

const deps = createCharactersEditorDependencies("http")

export default function NpcMonsterCharacterModal({
  rpgId,
  isOpen,
  mode,
  characterType,
  characterId,
  initialBootstrap = null,
  onClose
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<StepKey>("basic")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [bootstrap, setBootstrap] =
    useState<CharacterEditorBootstrapDto | null>(null)
  const [editingCharacter, setEditingCharacter] =
    useState<CharacterEditorSummaryDto | null>(null)
  const [createdCharacterId, setCreatedCharacterId] = useState<string | null>(
    characterId ?? null
  )
  const [image, setImage] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedImageName, setSelectedImageName] = useState("")
  const [name, setName] = useState("")
  const [titleNickname, setTitleNickname] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("public")
  const [narrativeStatus, setNarrativeStatus] =
    useState<NarrativeStatus>("vivo")
  const [secretFieldKeys, setSecretFieldKeys] = useState<SecretFieldKey[]>([])
  const [raceLabel, setRaceLabel] = useState("")
  const [classLabel, setClassLabel] = useState("")
  const [statusValues, setStatusValues] = useState<
    Record<string, NumericInputValue>
  >({})
  const [attributeValues, setAttributeValues] = useState<
    Record<string, NumericInputValue>
  >({})
  const [skillValues, setSkillValues] = useState<
    Record<string, NumericInputValue>
  >({})
  const [extraFields, setExtraFields] = useState<ExtraField[]>([
    createEmptyExtraField()
  ])
  const [customFieldModalOpen, setCustomFieldModalOpen] = useState(false)
  const [newFieldKey, setNewFieldKey] = useState("")
  const [newFieldValue, setNewFieldValue] = useState("")
  const {
    inventory,
    inventoryLoading,
    inventoryError,
    itemsLoading,
    abilities,
    abilitiesLoading,
    abilitiesError,
    skillsLoading,
    pickerMode,
    setPickerMode,
    pickerSearch,
    setPickerSearch,
    pickerSaving,
    removingAbilityKey,
    filteredAvailableItems,
    filteredAvailableSkills,
    openPicker,
    addInventoryItem,
    removeInventoryItem,
    addAbility,
    removeAbility
  } = useNpcMonsterLoadout({
    isOpen,
    rpgId,
    characterId: createdCharacterId
  })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let cancelled = false

    async function loadBootstrap() {
      try {
        setLoading(true)
        setError("")
        setStep("basic")
        const [payload, targetCharacter] =
          mode === "edit" && characterId
            ? await Promise.all([
                loadCharacterEditorBootstrapUseCase(deps, {
                  rpgId,
                  includeCharacters: false
                }),
                loadEditableCharacterUseCase(deps, { rpgId, characterId })
              ])
            : [
                initialBootstrap ??
                  (await loadCharacterEditorBootstrapUseCase(deps, {
                    rpgId,
                    includeCharacters: true
                  })),
                null
              ]
        if (cancelled) {
          return
        }

        const target = targetCharacter ?? null
        const nextBootstrap =
          target &&
          !payload.characters.some((character) => character.id === target.id)
            ? { ...payload, characters: [target, ...payload.characters] }
            : payload

        applyCharacterSnapshot(nextBootstrap, target, {
          setBootstrap,
          setEditingCharacter,
          setCreatedCharacterId,
          setImage,
          setSelectedImageFile,
          setSelectedImageName,
          setName,
          setTitleNickname,
          setDescription,
          setVisibility,
          setNarrativeStatus,
          setSecretFieldKeys,
          setRaceLabel,
          setClassLabel,
          setStatusValues,
          setAttributeValues,
          setSkillValues,
          setExtraFields
        })
        setCustomFieldModalOpen(false)
        setNewFieldKey("")
        setNewFieldValue("")
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Nao foi possivel carregar o formulario."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadBootstrap()

    return () => {
      cancelled = true
    }
  }, [characterId, initialBootstrap, isOpen, mode, rpgId])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setBootstrap(null)
      setEditingCharacter(null)
      setCreatedCharacterId(characterId ?? null)
      setSelectedImageFile(null)
      setSelectedImageName("")
      setError("")
      setStatusValues({})
      setAttributeValues({})
      setSkillValues({})
      setSecretFieldKeys([])
    }
  }, [characterId, isOpen])

  if (!isOpen) {
    return null
  }

  const currentCharacter = editingCharacter
  const imageStatusText = getNpcMonsterImageStatusText(image, selectedImageName)
  const canAdvance = createdCharacterId !== null
  const secretFieldOptions = buildNpcMonsterSecretFieldOptions(extraFields)
  const formState = buildNpcMonsterFormState({
    name,
    titleNickname,
    description,
    visibility,
    narrativeStatus,
    secretFieldKeys,
    raceLabel,
    classLabel,
    image,
    statusValues,
    attributeValues,
    skillValues,
    extraFields
  })
  function applyLocalCharacterSnapshot(
    nextCharacter: CharacterEditorSummaryDto
  ) {
    if (!bootstrap) {
      return
    }

    const nextBootstrap = upsertCharacterSnapshot(bootstrap, nextCharacter)

    applyCharacterSnapshot(nextBootstrap, nextCharacter, {
      setBootstrap,
      setEditingCharacter,
      setCreatedCharacterId,
      setImage,
      setSelectedImageFile,
      setSelectedImageName,
      setName,
      setTitleNickname,
      setDescription,
      setVisibility,
      setNarrativeStatus,
      setSecretFieldKeys,
      setRaceLabel,
      setClassLabel,
      setStatusValues,
      setAttributeValues,
      setSkillValues,
      setExtraFields
    })
  }

  async function persistCharacter(
    payload: UpsertCharacterPayloadDto | UpdateCharacterPayloadDto,
    successMessage: string
  ) {
    const targetCharacterId = createdCharacterId ?? null

    if (targetCharacterId) {
      const updatedCharacter = await updateCharacterUseCase(deps, {
        rpgId,
        characterId: targetCharacterId,
        payload
      })
      setCreatedCharacterId(targetCharacterId)
      applyLocalCharacterSnapshot(
        mergeCharacterSnapshot(editingCharacter, payload, updatedCharacter)
      )
    } else {
      const created = await createCharacterUseCase(deps, {
        rpgId,
        payload: payload as UpsertCharacterPayloadDto
      })
      setCreatedCharacterId(created.id)
      applyLocalCharacterSnapshot(
        mergeCharacterSnapshot(editingCharacter, payload, created)
      )
    }

    toast.success(successMessage)
  }

  async function handleSubmitBasic() {
    if (!bootstrap) {
      return
    }

    setSaving(true)
    setError("")

    let uploadedImageUrl = ""
    let submittedImage = image.trim() ? image.trim() : null
    let uploadedFreshImage = false

    try {
      if (selectedImageFile) {
        const upload = await uploadCharacterImageUseCase(deps, {
          file: selectedImageFile
        })
        uploadedImageUrl = upload.url
        submittedImage = upload.url
        uploadedFreshImage = true
      }

      const payload =
        createdCharacterId || mode === "edit"
          ? buildNpcMonsterBasicUpdatePayload({
              currentCharacter,
              basic: {
                ...formState,
                image: submittedImage ?? ""
              }
            })
          : buildNpcMonsterCreatePayload({
              currentCharacter,
              characterType,
              basic: {
                ...formState,
                image: submittedImage ?? ""
              },
              bonus: {
                statusValues,
                attributeValues,
                skillValues
              }
            })

      await persistCharacter(
        payload,
        mode === "edit" || createdCharacterId
          ? "Personagem salvo com sucesso."
          : "Personagem criado com sucesso."
      )

      setSelectedImageFile(null)
      setSelectedImageName("")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : mode === "edit"
            ? "Nao foi possivel salvar o personagem."
            : "Nao foi possivel criar o personagem."
      if (uploadedFreshImage && uploadedImageUrl) {
        try {
          await deleteCharacterImageByUrlUseCase(deps, {
            url: uploadedImageUrl
          })
        } catch {
          // Ignore cleanup failures after an unsuccessful submit.
        }
      }

      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    if (saving) {
      return
    }

    onClose()
  }

  function handleAddExtraField() {
    const key = newFieldKey.trim()
    if (!key) {
      return
    }

    setExtraFields((current) => [
      ...current.filter((item) => item.key.trim() || item.value.trim()),
      {
        id: crypto.randomUUID(),
        key,
        value: newFieldValue.trim()
      }
    ])
    setNewFieldKey("")
    setNewFieldValue("")
    setCustomFieldModalOpen(false)
  }

  function updateAttributeValue(key: string, value: string) {
    setAttributeValues((current) => ({
      ...current,
      [key]: parseNumericInputValue(value)
    }))
  }

  function updateStatusValue(key: string, value: string) {
    setStatusValues((current) => ({
      ...current,
      [key]: parseNumericInputValue(value)
    }))
  }

  function updateSkillValue(key: string, value: string) {
    setSkillValues((current) => ({
      ...current,
      [key]: parseNumericInputValue(value)
    }))
  }

  async function handleSubmitBonus() {
    if (!createdCharacterId) {
      return
    }

    try {
      setSaving(true)
      setError("")
      await persistCharacter(
        buildNpcMonsterBonusUpdatePayload({
          statusValues,
          attributeValues,
          skillValues
        }),
        "Bonus salvos com sucesso."
      )
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Nao foi possivel salvar os bonus do personagem."
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCharacter() {
    if (!createdCharacterId || deleting || saving) {
      return
    }

    if (!window.confirm("Tem certeza que deseja deletar este personagem?")) {
      return
    }

    try {
      setDeleting(true)
      setError("")
      await deleteCharacterUseCase(deps, {
        rpgId,
        characterId: createdCharacterId
      })
      toast.success("Personagem deletado com sucesso.")
      router.refresh()
      onClose()
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Nao foi possivel deletar o personagem."
      setError(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Cadastro de NPC ou criatura"
    >
      <section className={styles.modalShell}>
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.modalKicker}>
              {characterType === "npc" ? "NPC" : "Criatura"}
            </p>
            <h2 className={styles.modalTitle}>
              {mode === "edit" ? "Editar" : "Criar"}
            </h2>
          </div>
          <div className={styles.modalHeaderActions}>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={() => setCustomFieldModalOpen(true)}
              aria-label="Novo campo"
              title="Novo campo"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={handleClose}
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className={styles.modalStepTabs}>
          {npcMonsterSteps.map((item) => (
            <button
              key={item.key}
              type="button"
              className={
                step === item.key
                  ? `${styles.modalStepTab} ${styles.modalStepTabActive}`
                  : styles.modalStepTab
              }
              onClick={() => {
                if (item.key === "basic" || canAdvance) {
                  setStep(item.key)
                }
              }}
              disabled={item.key !== "basic" && !canAdvance}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={styles.modalInfo}>Carregando configuracoes...</p>
        ) : null}

        {!loading && step === "basic" ? (
          <NpcMonsterBasicStep
            bootstrap={bootstrap}
            image={image}
            imageStatusText={imageStatusText}
            selectedImageName={selectedImageName}
            name={name}
            titleNickname={titleNickname}
            description={description}
            visibility={visibility}
            narrativeStatus={narrativeStatus}
            secretFieldKeys={secretFieldKeys}
            secretFieldOptions={secretFieldOptions}
            raceLabel={raceLabel}
            classLabel={classLabel}
            statusValues={statusValues}
            extraFields={extraFields}
            onImageSelect={(file) => {
              setSelectedImageFile(file)
              setSelectedImageName(file.name)
            }}
            onImageRemove={() => {
              setImage("")
              setSelectedImageFile(null)
              setSelectedImageName("")
            }}
            onNameChange={setName}
            onTitleChange={setTitleNickname}
            onDescriptionChange={setDescription}
            onVisibilityChange={setVisibility}
            onNarrativeStatusChange={setNarrativeStatus}
            onSecretFieldKeysChange={setSecretFieldKeys}
            onRaceChange={setRaceLabel}
            onClassChange={setClassLabel}
            onStatusChange={updateStatusValue}
            onExtraFieldValueChange={(fieldId, value) =>
              setExtraFields((current) =>
                current.map((item) =>
                  item.id === fieldId ? { ...item, value } : item
                )
              )
            }
            onRemoveExtraField={(fieldId) =>
              setExtraFields((current) =>
                current.filter((item) => item.id !== fieldId)
              )
            }
            onResetError={() => setError("")}
          />
        ) : null}

        {!loading && step === "inventory" ? (
          <NpcMonsterInventoryStep
            inventory={inventory}
            inventoryLoading={inventoryLoading}
            inventoryError={inventoryError}
            itemsLoading={itemsLoading}
            canManage={Boolean(createdCharacterId)}
            onOpenPicker={() => openPicker("inventory")}
            onRemoveItem={(inventoryItemId, quantity) =>
              void removeInventoryItem(inventoryItemId, quantity)
            }
          />
        ) : null}

        {!loading && step === "bonus" ? (
          <NpcMonsterBonusStep
            bootstrap={bootstrap}
            attributeValues={attributeValues}
            skillValues={skillValues}
            saving={saving}
            onAttributeChange={updateAttributeValue}
            onSkillChange={updateSkillValue}
            onSave={() => void handleSubmitBonus()}
          />
        ) : null}

        {!loading && step === "abilities" ? (
          <NpcMonsterAbilitiesStep
            characterId={createdCharacterId}
            abilities={abilities}
            abilitiesLoading={abilitiesLoading}
            abilitiesError={abilitiesError}
            skillsLoading={skillsLoading}
            removingAbilityKey={removingAbilityKey}
            onOpenPicker={() => openPicker("abilities")}
            onRemoveAbility={(skillId, level) => {
              if (removingAbilityKey === `${skillId}:${level}`) {
                return
              }
              void removeAbility(skillId, level)
            }}
            onClose={handleClose}
          />
        ) : null}

        {error ? <p className={styles.modalError}>{error}</p> : null}

        {!loading && step === "basic" ? (
          <footer className={styles.modalFooter}>
            <button
              type="button"
              className={styles.modalSecondaryButton}
              onClick={handleClose}
            >
              Cancelar
            </button>
            {mode === "edit" && createdCharacterId ? (
              <button
                type="button"
                className={styles.modalDangerButton}
                onClick={() => void handleDeleteCharacter()}
                disabled={deleting || saving}
              >
                {deleting ? "Deletando..." : "Deletar personagem"}
              </button>
            ) : null}
            <button
              type="button"
              className={styles.modalPrimaryButton}
              onClick={() => void handleSubmitBasic()}
              disabled={saving || name.trim().length === 0}
            >
              {saving
                ? mode === "edit"
                  ? "Salvando..."
                  : "Criando..."
                : "Salvar"}
            </button>
          </footer>
        ) : null}
      </section>

      <NpcMonsterPickerModal
        mode={pickerMode}
        isSaving={pickerSaving}
        search={pickerSearch}
        availableItems={filteredAvailableItems}
        availableSkills={filteredAvailableSkills}
        onClose={() => setPickerMode(null)}
        onSearchChange={setPickerSearch}
        onAddItem={(itemId) => void addInventoryItem(itemId)}
        onAddSkill={(skillId) => void addAbility(skillId)}
      />

      <NpcMonsterExtraFieldModal
        isOpen={customFieldModalOpen}
        newFieldKey={newFieldKey}
        newFieldValue={newFieldValue}
        onClose={() => setCustomFieldModalOpen(false)}
        onKeyChange={setNewFieldKey}
        onValueChange={setNewFieldValue}
        onSubmit={handleAddExtraField}
      />
    </div>
  )
}
