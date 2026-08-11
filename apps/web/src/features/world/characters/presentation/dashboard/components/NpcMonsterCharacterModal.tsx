"use client"

import { Plus, X } from "lucide-react"
import type { CharacterEditorBootstrapDto } from "@/features/world/characters/application/editor"
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
import { useNpcMonsterCharacterController } from "./npc-monster-modal/hooks/useNpcMonsterCharacterController"

type Props = {
  rpgId: string
  isOpen: boolean
  mode: "create" | "edit"
  characterType: "npc" | "monster"
  characterId?: string | null
  initialBootstrap?: CharacterEditorBootstrapDto | null
  onClose: () => void
}

export default function NpcMonsterCharacterModal(props: Props) {
  const controller = useNpcMonsterCharacterController(props)
  if (!props.isOpen) return null

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
              {props.characterType === "npc" ? "NPC" : "Criatura"}
            </p>
            <h2 className={styles.modalTitle}>
              {props.mode === "edit" ? "Editar" : "Criar"}
            </h2>
          </div>
          <div className={styles.modalHeaderActions}>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={controller.openCustomFieldModal}
              aria-label="Novo campo"
              title="Novo campo"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={controller.close}
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
                controller.step === item.key
                  ? `${styles.modalStepTab} ${styles.modalStepTabActive}`
                  : styles.modalStepTab
              }
              onClick={() => {
                if (item.key === "basic" || controller.canAdvance) {
                  controller.setStep(item.key)
                }
              }}
              disabled={item.key !== "basic" && !controller.canAdvance}
            >
              {item.label}
            </button>
          ))}
        </div>

        {controller.loading ? (
          <p className={styles.modalInfo}>Carregando configuracoes...</p>
        ) : null}

        {!controller.loading && controller.step === "basic" ? (
          <NpcMonsterBasicStep
            bootstrap={controller.bootstrap}
            image={controller.image}
            imageStatusText={controller.imageStatusText}
            selectedImageName={controller.selectedImageName}
            name={controller.name}
            titleNickname={controller.titleNickname}
            description={controller.description}
            visibility={controller.visibility}
            narrativeStatus={controller.narrativeStatus}
            secretFieldKeys={controller.secretFieldKeys}
            secretFieldOptions={controller.secretFieldOptions}
            raceLabel={controller.raceLabel}
            classLabel={controller.classLabel}
            statusValues={controller.statusValues}
            extraFields={controller.extraFields}
            onImageSelect={(file) => {
              controller.setSelectedImageFile(file)
              controller.setSelectedImageName(file.name)
            }}
            onImageRemove={() => {
              controller.setImage("")
              controller.setSelectedImageFile(null)
              controller.setSelectedImageName("")
            }}
            onNameChange={controller.setName}
            onTitleChange={controller.setTitleNickname}
            onDescriptionChange={controller.setDescription}
            onVisibilityChange={controller.setVisibility}
            onNarrativeStatusChange={controller.setNarrativeStatus}
            onSecretFieldKeysChange={controller.setSecretFieldKeys}
            onRaceChange={controller.setRaceLabel}
            onClassChange={controller.setClassLabel}
            onStatusChange={controller.updateStatusValue}
            onExtraFieldValueChange={(fieldId, value) =>
              controller.setExtraFields((current) =>
                current.map((item) =>
                  item.id === fieldId ? { ...item, value } : item
                )
              )
            }
            onRemoveExtraField={(fieldId) =>
              controller.setExtraFields((current) =>
                current.filter((item) => item.id !== fieldId)
              )
            }
            onResetError={controller.clearError}
          />
        ) : null}

        {!controller.loading && controller.step === "inventory" ? (
          <NpcMonsterInventoryStep
            inventory={controller.inventory}
            inventoryLoading={controller.inventoryLoading}
            inventoryError={controller.inventoryError}
            itemsLoading={controller.itemsLoading}
            canManage={Boolean(controller.createdCharacterId)}
            onOpenPicker={() => controller.openPicker("inventory")}
            onRemoveItem={(inventoryItemId, quantity) =>
              void controller.removeInventoryItem(inventoryItemId, quantity)
            }
          />
        ) : null}

        {!controller.loading && controller.step === "bonus" ? (
          <NpcMonsterBonusStep
            bootstrap={controller.bootstrap}
            attributeValues={controller.attributeValues}
            skillValues={controller.skillValues}
            saving={controller.saving}
            onAttributeChange={controller.updateAttributeValue}
            onSkillChange={controller.updateSkillValue}
            onSave={() => void controller.submitBonus()}
          />
        ) : null}

        {!controller.loading && controller.step === "abilities" ? (
          <NpcMonsterAbilitiesStep
            characterId={controller.createdCharacterId}
            abilities={controller.abilities}
            abilitiesLoading={controller.abilitiesLoading}
            abilitiesError={controller.abilitiesError}
            skillsLoading={controller.skillsLoading}
            removingAbilityKey={controller.removingAbilityKey}
            onOpenPicker={() => controller.openPicker("abilities")}
            onRemoveAbility={(skillId, level) => {
              if (controller.removingAbilityKey !== `${skillId}:${level}`) {
                void controller.removeAbility(skillId, level)
              }
            }}
            onClose={controller.close}
          />
        ) : null}

        {controller.error ? (
          <p className={styles.modalError}>{controller.error}</p>
        ) : null}

        {!controller.loading && controller.step === "basic" ? (
          <footer className={styles.modalFooter}>
            <button
              type="button"
              className={styles.modalSecondaryButton}
              onClick={controller.close}
            >
              Cancelar
            </button>
            {props.mode === "edit" && controller.createdCharacterId ? (
              <button
                type="button"
                className={styles.modalDangerButton}
                onClick={() => void controller.deleteCharacter()}
                disabled={controller.deleting || controller.saving}
              >
                {controller.deleting ? "Deletando..." : "Deletar personagem"}
              </button>
            ) : null}
            <button
              type="button"
              className={styles.modalPrimaryButton}
              onClick={() => void controller.submitBasic()}
              disabled={controller.saving || controller.name.trim().length === 0}
            >
              {controller.saving
                ? props.mode === "edit"
                  ? "Salvando..."
                  : "Criando..."
                : "Salvar"}
            </button>
          </footer>
        ) : null}
      </section>

      <NpcMonsterPickerModal
        mode={controller.pickerMode}
        isSaving={controller.pickerSaving}
        search={controller.pickerSearch}
        availableItems={controller.filteredAvailableItems}
        availableSkills={controller.filteredAvailableSkills}
        onClose={() => controller.setPickerMode(null)}
        onSearchChange={controller.setPickerSearch}
        onAddItem={(itemId) => void controller.addInventoryItem(itemId)}
        onAddSkill={(skillId) => void controller.addAbility(skillId)}
      />

      <NpcMonsterExtraFieldModal
        isOpen={controller.customFieldModalOpen}
        newFieldKey={controller.newFieldKey}
        newFieldValue={controller.newFieldValue}
        onClose={controller.closeCustomFieldModal}
        onKeyChange={controller.setNewFieldKey}
        onValueChange={controller.setNewFieldValue}
        onSubmit={controller.addExtraField}
      />
    </div>
  )
}
