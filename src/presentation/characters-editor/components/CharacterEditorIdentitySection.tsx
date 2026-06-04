"use client"

import { ImagePlus, Paperclip, Trash2 } from "lucide-react"
import ReactSelect from "react-select"
import type { SingleValue, StylesConfig } from "react-select"
import {
  getProgressionModeLabel,
  type ProgressionMode,
  type ProgressionTier,
} from "@/lib/rpg/progression"
import styles from "../CharacterEditorForm.module.css"
import EditableModalField from "./EditableModalField"
import type {
  CharacterEditorCharacterTypeDto,
  CharacterIdentityFieldDto,
  CharacterOptionDto,
} from "@/application/characters/editor"

const CHARACTER_TYPE_LABEL: Record<CharacterEditorCharacterTypeDto, string> = {
  player: "Player",
  npc: "NPC",
  monster: "Criatura",
}

type Props = {
  identityNameField: CharacterIdentityFieldDto | null
  name: string
  image: string
  imageStatusText: string
  uploadingImage: boolean
  uploadError: string
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useInventoryWeightLimit: boolean
  editingCharacterId: string | null
  canManageCharacters: boolean
  raceTemplates: CharacterOptionDto[]
  classTemplates: CharacterOptionDto[]
  raceKey: string
  classKey: string
  characterType: CharacterEditorCharacterTypeDto
  resolvedProgressionTier: ProgressionTier
  progressionMode: ProgressionMode
  progressionCurrent: string
  maxCarryWeight: string
  characterVisibility: "private" | "public"
  identityTemplates: CharacterIdentityFieldDto[]
  identityValues: Record<string, string>
  saving: boolean
  deleting: boolean
  onNameChange: (value: string) => void
  onImageSelect: (file: File) => void
  onImageRemove: () => void
  onRaceChange: (value: string) => void
  onClassChange: (value: string) => void
  onCharacterTypeChange: (value: CharacterEditorCharacterTypeDto) => void
  onMaxCarryWeightChange: (value: string) => void
  onVisibilityChange: (value: "private" | "public") => void
  onIdentityFieldChange: (key: string, value: string) => void
}

type SelectOption = {
  value: string
  label: string
}

const reactSelectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 9,
    borderColor: state.isFocused ? "var(--color-brand-primary)" : "var(--color-border-soft)",
    backgroundColor: "var(--color-bg-hover)",
    boxShadow: state.isFocused ? "var(--shadow-brand-glow)" : "none",
    ":hover": {
      borderColor: "var(--color-brand-primary)",
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-bg-surface)",
    border: "1px solid var(--color-border-soft)",
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "var(--color-bg-hover)" : "var(--color-bg-surface)",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
  }),
  input: (base) => ({
    ...base,
    color: "var(--color-text-secondary)",
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--color-text-muted)",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--color-text-secondary)",
  }),
}

export default function CharacterEditorIdentitySection({
  identityNameField,
  name,
  image,
  imageStatusText,
  uploadingImage,
  uploadError,
  useRaceBonuses,
  useClassBonuses,
  useInventoryWeightLimit,
  editingCharacterId,
  canManageCharacters,
  raceTemplates,
  classTemplates,
  raceKey,
  classKey,
  characterType,
  resolvedProgressionTier,
  progressionMode,
  progressionCurrent,
  maxCarryWeight,
  characterVisibility,
  identityTemplates,
  identityValues,
  saving,
  deleting,
  onNameChange,
  onImageSelect,
  onImageRemove,
  onRaceChange,
  onClassChange,
  onCharacterTypeChange,
  onMaxCarryWeightChange,
  onVisibilityChange,
  onIdentityFieldChange,
}: Props) {
  const isEditing = Boolean(editingCharacterId)
  const raceOptions = [
    { value: "", label: "Sem raca" },
    ...raceTemplates.map((item) => ({ value: item.key, label: item.label })),
  ]
  const selectedRaceOption = raceOptions.find((option) => option.value === raceKey) ?? raceOptions[0]
  const classOptions = [
    { value: "", label: "Sem classe" },
    ...classTemplates.map((item) => ({ value: item.key, label: item.label })),
  ]
  const selectedClassOption = classOptions.find((option) => option.value === classKey) ?? classOptions[0]
  const characterTypeOptions = [
    { value: "player", label: "Player" },
    { value: "npc", label: "NPC" },
    { value: "monster", label: "Criatura" },
  ]
  const selectedCharacterTypeOption =
    characterTypeOptions.find((option) => option.value === characterType) ?? characterTypeOptions[0]

  function handleRaceChange(option: SingleValue<SelectOption>) {
    onRaceChange(option?.value ?? "")
  }

  function handleClassChange(option: SingleValue<SelectOption>) {
    onClassChange(option?.value ?? "")
  }

  function handleCharacterTypeChange(option: SingleValue<SelectOption>) {
    const value = option?.value
    if (value === "player" || value === "npc" || value === "monster") {
      onCharacterTypeChange(value)
    }
  }

  return (
    <section className={`${styles.section} characterEditorSection`}>
      <h2>Identificacao</h2>
      <div className={styles.identityGrid}>
        {!identityNameField ? (
          isEditing ? (
            <EditableModalField
              label="Nome"
              value={name}
              required
              onSave={onNameChange}
            />
          ) : (
            <label className={styles.field}>
              <span>Nome</span>
              <input
                type="text"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                minLength={2}
                required
              />
            </label>
          )
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
                onClick={onImageRemove}
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
                onImageSelect(file)
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
                value={raceTemplates.find((item) => item.key === raceKey)?.label ?? "Sem raca"}
                readOnly
              />
            ) : (
              <ReactSelect<SelectOption, false>
                instanceId="character-race-select"
                inputId="character-race-select"
                options={raceOptions}
                value={selectedRaceOption}
                onChange={handleRaceChange}
                isDisabled={saving || deleting}
                placeholder="Sem raca"
                noOptionsMessage={() => "Nenhuma raca disponivel"}
                styles={reactSelectStyles}
              />
            )}
          </label>
        ) : null}

        {useClassBonuses && classTemplates.length > 0 ? (
          <label className={styles.field}>
            <span>Classe</span>
            {editingCharacterId && !canManageCharacters ? (
              <input
                type="text"
                value={classTemplates.find((item) => item.key === classKey)?.label ?? "Sem classe"}
                readOnly
              />
            ) : (
              <ReactSelect<SelectOption, false>
                instanceId="character-class-select"
                inputId="character-class-select"
                options={classOptions}
                value={selectedClassOption}
                onChange={handleClassChange}
                isDisabled={saving || deleting}
                placeholder="Sem classe"
                noOptionsMessage={() => "Nenhuma classe disponivel"}
                styles={reactSelectStyles}
              />
            )}
          </label>
        ) : null}

        <label className={styles.field}>
          <span>Tipo</span>
          {editingCharacterId ? (
            <input type="text" value={CHARACTER_TYPE_LABEL[characterType]} readOnly />
          ) : (
            <ReactSelect<SelectOption, false>
              instanceId="character-type-select"
              inputId="character-type-select"
              options={characterTypeOptions}
              value={selectedCharacterTypeOption}
              onChange={handleCharacterTypeChange}
              isDisabled={saving || deleting}
              isSearchable={false}
              styles={reactSelectStyles}
            />
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
          <input type="number" onWheel={(event) => event.currentTarget.blur()} min={0} value={progressionCurrent} readOnly />
        </label>

        {useInventoryWeightLimit && characterType === "player" ? (
          isEditing ? (
            <EditableModalField
              label="Peso maximo (kg)"
              type="number"
              min={0}
              step="0.1"
              value={maxCarryWeight}
              placeholder="Ex.: 30"
              required
              onSave={onMaxCarryWeightChange}
            />
          ) : (
            <label className={styles.field}>
              <span>Peso maximo (kg)</span>
              <input
                type="number"
                onWheel={(event) => event.currentTarget.blur()}
                min={0}
                step="0.1"
                value={maxCarryWeight}
                onChange={(event) => onMaxCarryWeightChange(event.target.value)}
                placeholder="Ex.: 30"
                required
              />
            </label>
          )
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
                onClick={() => onVisibilityChange("public")}
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
                onClick={() => onVisibilityChange("private")}
              >
                Privado
              </button>
            </div>
          </div>
        ) : null}

        {identityTemplates.map((field) =>
          isEditing ? (
            <EditableModalField
              key={`identity-${field.key}`}
              label={field.label}
              value={identityValues[field.key] ?? ""}
              required={field.required}
              onSave={(value) => onIdentityFieldChange(field.key, value)}
            />
          ) : (
            <label className={styles.field} key={`identity-${field.key}`}>
              <span>{field.label}</span>
              <input
                type="text"
                value={identityValues[field.key] ?? ""}
                onChange={(event) => onIdentityFieldChange(field.key, event.target.value)}
                required={field.required}
              />
            </label>
          ),
        )}
      </div>
    </section>
  )
}
