"use client"

import { ImagePlus, Paperclip, Trash2 } from "lucide-react"
import { NativeSelectField } from "@/components/select/NativeSelectField"
import {
  getProgressionModeLabel,
  type ProgressionMode,
  type ProgressionTier,
} from "@/lib/rpg/progression"
import styles from "../CharacterEditorForm.module.css"
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
  return (
    <section className={styles.section}>
      <h2>Identificacao</h2>
      <div className={styles.identityGrid}>
        {!identityNameField ? (
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
              <NativeSelectField value={raceKey} onChange={(event) => onRaceChange(event.target.value)}>
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
                value={classTemplates.find((item) => item.key === classKey)?.label ?? "Sem classe"}
                readOnly
              />
            ) : (
              <NativeSelectField value={classKey} onChange={(event) => onClassChange(event.target.value)}>
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
              onChange={(event) => onCharacterTypeChange(event.target.value as CharacterEditorCharacterTypeDto)}
            >
              <option value="player">Player</option>
              <option value="npc">NPC</option>
              <option value="monster">Criatura</option>
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
          <input type="number" onWheel={(event) => event.currentTarget.blur()} min={0} value={progressionCurrent} readOnly />
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
              onChange={(event) => onMaxCarryWeightChange(event.target.value)}
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

        {identityTemplates.map((field) => (
          <label className={styles.field} key={`identity-${field.key}`}>
            <span>{field.label}</span>
            <input
              type="text"
              value={identityValues[field.key] ?? ""}
              onChange={(event) => onIdentityFieldChange(field.key, event.target.value)}
              required={field.required}
            />
          </label>
        ))}
      </div>
    </section>
  )
}
