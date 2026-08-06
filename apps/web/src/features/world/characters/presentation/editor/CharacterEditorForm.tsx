"use client"

import ReactSelect from "react-select"
import type {
  CharacterEditorBootstrapDto,
  CharactersEditorDependencies,
} from "@/features/world/characters/application/editor"
import styles from "./CharacterEditorForm.module.css"
import {
  CharacterEditorActions,
  CharacterEditorIdentitySection,
  CharacterEditorNumericSection,
  CharacterEditorTextSection,
} from "./components"
import {
  useCharacterEditorController,
  type PlayerSelectOption,
} from "./useCharacterEditorController"

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
  const editor = useCharacterEditorController({
    rpgId,
    characterId,
    deps,
    initialBootstrap,
    onCompleted,
    onDeleted,
  })

  const content = (
    <form className={styles.form} onSubmit={editor.handleSubmit}>
      <CharacterEditorIdentitySection
        identityNameField={editor.identityNameField}
        name={editor.name}
        image={editor.image}
        imageStatusText={editor.imageStatusText}
        uploadingImage={editor.uploadingImage}
        uploadError={editor.uploadError}
        useRaceBonuses={editor.useRaceBonuses}
        useClassBonuses={editor.useClassBonuses}
        useInventoryWeightLimit={editor.useInventoryWeightLimit}
        editingCharacterId={editor.editingCharacterId}
        canManageCharacters={editor.canManageCharacters}
        raceTemplates={editor.raceTemplates}
        classTemplates={editor.classTemplates}
        raceKey={editor.raceKey}
        classKey={editor.classKey}
        characterType={editor.characterType}
        resolvedProgressionTier={editor.resolvedProgressionTier}
        progressionMode={editor.progressionMode}
        progressionCurrent={editor.progressionCurrent}
        maxCarryWeight={editor.maxCarryWeight}
        characterVisibility={editor.characterVisibility}
        identityTemplates={editor.identityTemplates}
        identityValues={editor.identityValues}
        saving={editor.saving}
        deleting={editor.deleting}
        onNameChange={editor.setName}
        onImageSelect={editor.handleImageUpload}
        onImageRemove={editor.handleRemoveImage}
        onRaceChange={editor.setRaceKey}
        onClassChange={editor.setClassKey}
        onCharacterTypeChange={editor.setCharacterType}
        onMaxCarryWeightChange={editor.setMaxCarryWeight}
        onVisibilityChange={editor.setCharacterVisibility}
        onIdentityFieldChange={editor.updateIdentityField}
      />

      <CharacterEditorTextSection
        title="Caracteristicas"
        fields={editor.characteristicsTemplates}
        values={editor.characteristicsValues}
        editInModal={Boolean(editor.editingCharacterId)}
        onFieldChange={editor.updateCharacteristicsField}
      />

      {!editor.editingCharacterId &&
      editor.canManageCharacters &&
      editor.characterType === "player" ? (
        <section className={`${styles.section} characterEditorSection`}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Enviar ao jogador</h2>
            </div>
          </div>
          <label className={styles.field}>
            <span>Jogador</span>
            <ReactSelect<PlayerSelectOption, false>
              instanceId={`character-offer-player-${rpgId}`}
              inputId={`character-offer-player-${rpgId}`}
              options={editor.assignablePlayerOptions}
              value={editor.selectedOfferPlayer}
              onChange={editor.handleOfferPlayerChange}
              isClearable
              isDisabled={
                editor.saving || editor.assignablePlayerOptions.length === 0
              }
              placeholder={
                editor.assignablePlayerOptions.length === 0
                  ? "Nenhum jogador disponivel"
                  : "Nao enviar agora"
              }
              noOptionsMessage={() => "Nenhum jogador disponivel"}
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 42,
                  borderRadius: 9,
                  borderColor: state.isFocused
                    ? "var(--color-brand-primary)"
                    : "var(--color-border-soft)",
                  backgroundColor: "var(--color-bg-hover)",
                  boxShadow: state.isFocused
                    ? "var(--shadow-brand-glow)"
                    : "none",
                  ":hover": { borderColor: "var(--color-brand-primary)" },
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border-soft)",
                  zIndex: 50,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused
                    ? "var(--color-bg-hover)"
                    : "var(--color-bg-surface)",
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
              }}
            />
          </label>
        </section>
      ) : null}

      <CharacterEditorNumericSection
        title="Status"
        items={editor.statuses}
        values={editor.statusValues}
        visible={editor.showStatusSection}
        keyPrefix="character-status"
        min={0}
        editInModal={Boolean(editor.editingCharacterId)}
        onToggle={() =>
          editor.setShowStatusSection((current) => !current)
        }
        onChange={editor.updateStatus}
      />

      <CharacterEditorNumericSection
        title="Atributos"
        items={editor.attributes}
        values={editor.values}
        visible={editor.showAttributeSection}
        keyPrefix="character-attribute"
        editInModal={Boolean(editor.editingCharacterId)}
        onToggle={() =>
          editor.setShowAttributeSection((current) => !current)
        }
        onChange={editor.updateAttribute}
      />

      {editor.skills.length > 0 &&
      (!editor.editingCharacterId || editor.canManageCharacters) ? (
        <CharacterEditorNumericSection
          title="Pericias"
          items={editor.skills}
          values={editor.skillValues}
          visible={editor.showSkillSection}
          keyPrefix="character-skill"
          min={0}
          editInModal={Boolean(editor.editingCharacterId)}
          onToggle={() =>
            editor.setShowSkillSection((current) => !current)
          }
          onChange={editor.updateSkill}
        />
      ) : null}

      {editor.error ? <p className={styles.error}>{editor.error}</p> : null}

      <CharacterEditorActions
        rpgId={rpgId}
        editingCharacterId={editor.editingCharacterId}
        saving={editor.saving}
        deleting={editor.deleting}
        canSubmit={
          !editor.saving &&
          editor.attributes.length > 0 &&
          editor.statuses.length > 0
        }
        showDeleteConfirm={editor.showDeleteConfirm}
        onCancel={onCancel}
        onDeleteRequest={() => editor.setShowDeleteConfirm(true)}
        onDeleteConfirm={() => void editor.handleDeleteCharacter()}
        onDeleteCancel={() => editor.setShowDeleteConfirm(false)}
      />
    </form>
  )

  if (editor.loading) {
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

  if (presentation === "embedded") return content

  return (
    <main className={styles.page}>
      <section className={styles.card}>{content}</section>
    </main>
  )
}
