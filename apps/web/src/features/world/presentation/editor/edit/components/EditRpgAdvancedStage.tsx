import { useState } from "react"
import { Eye, LoaderCircle, Save } from "lucide-react"
import { getProgressionModeLabel } from "@forgetab/world-contracts/rpg/progression"
import type { RpgEditorDependencies } from "@/features/world/application/editor/contracts/RpgEditorDependencies"
import type { CatalogOption } from "./shared/types"
import type { useEditRpgState } from "../hooks/useEditRpgState"
import AbilityCategoriesSection from "./ability-categories/AbilityCategoriesSection"
import AttributeOptionsSection from "./attribute-options/AttributeOptionsSection"
import PlayerTemplateFieldsSection from "./player-template-fields/PlayerTemplateFieldsSection"
import ProgressionLevelsModal from "./ProgressionLevelsModal"
import RaceClassOptionsSection from "./race-class-options/RaceClassOptionsSection"
import RadixSwitchField from "./shared/RadixSwitchField"
import SkillOptionsSection from "./skill-options/SkillOptionsSection"
import StatusOptionsSection from "./status-options/StatusOptionsSection"
import styles from "../page.module.css"

export const CORE_STATUS_OPTIONS: CatalogOption[] = [
  { key: "life", label: "Vida" },
  { key: "mana", label: "Mana" },
  { key: "sanity", label: "Sanidade" },
  { key: "exhaustion", label: "Exaustão" }
]

type Props = {
  state: ReturnType<typeof useEditRpgState>
  deps: RpgEditorDependencies
  rpgId: string
  saving: boolean
  error: string
  success: string
  onSave: () => Promise<void>
  onOpenRaces: () => void
  onOpenClasses: () => void
}

export default function EditRpgAdvancedStage({
  state,
  deps,
  rpgId,
  saving,
  error,
  success,
  onSave,
  onOpenRaces,
  onOpenClasses
}: Props) {
  const [progressionModalOpen, setProgressionModalOpen] = useState(false)

  return (
    <section className={styles.advancedStage}>
      <RadixSwitchField
        id="edit-rpg-mundi-map"
        label="Mapa mundi"
        description={state.useMundiMap ? "Ativo no RPG" : "Desativado no RPG"}
        checked={state.useMundiMap}
        onCheckedChange={state.setUseMundiMap}
      />
      <RadixSwitchField
        id="edit-rpg-weight-limit"
        label="Controle de peso no inventario"
        description={
          state.useInventoryWeightLimit
            ? "Peso limitado habilitado"
            : "Sem limite de peso"
        }
        checked={state.useInventoryWeightLimit}
        onCheckedChange={state.setUseInventoryWeightLimit}
      />
      <RadixSwitchField
        id="edit-rpg-use-race"
        label="Usar raca"
        description={state.useRaceBonuses ? "Racas habilitadas" : "Racas desativadas"}
        checked={state.useRaceBonuses}
        onCheckedChange={state.setUseRaceBonuses}
      />
      <RadixSwitchField
        id="edit-rpg-use-class"
        label="Usar classe"
        description={
          state.useClassBonuses ? "Classes habilitadas" : "Classes desativadas"
        }
        checked={state.useClassBonuses}
        onCheckedChange={state.setUseClassBonuses}
      />

      <div className={styles.field}>
        <span>
          <Eye size={14} /> Custos (somente leitura)
        </span>
        <input value={state.costsEnabled ? "Ativado" : "Desativado"} readOnly />
        <input value={state.costResourceName} readOnly />
        <p className={styles.error}>
          Configuracao disponivel apenas na criacao do RPG.
        </p>
      </div>

      <section className={styles.progressionSection}>
        <h2>Progressao</h2>
        <button
          type="button"
          className={styles.progressionModePickerButton}
          disabled
          title="Modo de progressao definido na criacao do RPG."
        >
          {getProgressionModeLabel(state.progressionMode)}
        </button>
        <button
          type="button"
          className={styles.progressionTableToggleButton}
          onClick={() => setProgressionModalOpen(true)}
        >
          Editar etapas
        </button>
      </section>

      <ProgressionLevelsModal
        open={progressionModalOpen}
        mode={state.progressionMode}
        tiers={state.progressionTiers}
        onClose={() => setProgressionModalOpen(false)}
        onAdd={state.addProgressionTier}
        onRemove={state.removeProgressionTier}
        onLabelChange={state.updateProgressionTierLabel}
        onRequiredChange={state.updateProgressionTierRequired}
      />

      <AttributeOptionsSection
        showList={state.showAttributeList}
        onToggleList={() => state.setShowAttributeList((prev) => !prev)}
        newAttributeLabel={state.newAttributeLabel}
        onNewAttributeLabelChange={state.setNewAttributeLabel}
        onAddAttribute={state.addAttribute}
        attributeTemplates={state.attributeTemplates}
        onRemoveAttribute={state.removeAttribute}
      />
      <StatusOptionsSection
        showList={state.showStatusList}
        onToggleList={() => state.setShowStatusList((prev) => !prev)}
        coreStatusOptions={CORE_STATUS_OPTIONS}
        selectedStatusKeys={state.selectedStatusKeys}
        statusLabelByKey={state.statusLabelByKey}
        newCustomStatusLabel={state.newCustomStatusLabel}
        onNewCustomStatusLabelChange={state.setNewCustomStatusLabel}
        onToggleStatus={state.toggleStatusKey}
        onAddCustomStatus={state.addCustomStatus}
        onUpdateCustomStatusLabel={state.updateCustomStatusLabel}
        onRemoveCustomStatus={state.removeCustomStatus}
      />
      <SkillOptionsSection
        showList={state.showSkillList}
        onToggleList={() => state.setShowSkillList((prev) => !prev)}
        newSkillLabel={state.newSkillLabel}
        onNewSkillLabelChange={state.setNewSkillLabel}
        onAddSkill={state.addSkill}
        skillTemplates={state.skillTemplates}
        onRemoveSkill={state.removeSkill}
      />
      <AbilityCategoriesSection
        showList={state.showAbilityCategoriesList}
        onToggleList={() =>
          state.setShowAbilityCategoriesList((prev) => !prev)
        }
        abilityCategoriesEnabled={state.abilityCategoriesEnabled}
        enabledAbilityCategories={state.enabledAbilityCategories}
        onAbilityCategoriesEnabledChange={state.setAbilityCategoriesEnabled}
        onToggleCategory={state.toggleAbilityCategory}
      />
      <PlayerTemplateFieldsSection
        title="Identidade do Player"
        description="Defina os campos de identificacao que o Player precisa preencher."
        showList={state.showCharacterIdentityList}
        onToggleList={() => state.setShowCharacterIdentityList((prev) => !prev)}
        toggleLabelOpen="Ocultar campos"
        toggleLabelClosed="Mostrar campos"
        newFieldLabel={state.newIdentityLabel}
        onNewFieldLabelChange={state.setNewIdentityLabel}
        addPlaceholder="Ex.: Sobrenome"
        addAriaLabel="Adicionar campo de identidade"
        addTitle="Adicionar campo de identidade"
        onAddField={state.addIdentityField}
        fields={state.characterIdentityTemplates}
        onUpdateFieldLabel={state.updateIdentityFieldLabel}
        onUpdateFieldRequired={state.updateIdentityFieldRequired}
        onRemoveField={state.removeIdentityField}
        removeLabelPrefix="Remover campo"
      />
      <PlayerTemplateFieldsSection
        title="Caracteristicas do Player"
        description="Defina os campos de caracteristicas que o Player precisa preencher."
        showList={state.showCharacterCharacteristicsList}
        onToggleList={() =>
          state.setShowCharacterCharacteristicsList((prev) => !prev)
        }
        toggleLabelOpen="Ocultar campos"
        toggleLabelClosed="Mostrar campos"
        newFieldLabel={state.newCharacteristicLabel}
        onNewFieldLabelChange={state.setNewCharacteristicLabel}
        addPlaceholder="Ex.: Cicatriz no rosto"
        addAriaLabel="Adicionar campo de caracteristica"
        addTitle="Adicionar campo de caracteristica"
        onAddField={state.addCharacteristicField}
        fields={state.characterCharacteristicTemplates}
        onUpdateFieldLabel={state.updateCharacteristicFieldLabel}
        onUpdateFieldRequired={state.updateCharacteristicFieldRequired}
        onRemoveField={state.removeCharacteristicField}
        removeLabelPrefix="Remover caracteristica"
      />
      <RaceClassOptionsSection
        deps={deps}
        rpgId={rpgId}
        showRaceList={state.showRaceList}
        onToggleRaceList={() => state.setShowRaceList((prev) => !prev)}
        onCreateRace={onOpenRaces}
        raceDrafts={state.raceDrafts}
        onRaceDraftsChange={state.setRaceDrafts}
        showClassList={state.showClassList}
        onToggleClassList={() => state.setShowClassList((prev) => !prev)}
        onCreateClass={onOpenClasses}
        classDrafts={state.classDrafts}
        onClassDraftsChange={state.setClassDrafts}
      />

      <div className={styles.actions}>
        <button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? (
            <>
              <LoaderCircle size={16} className={styles.spin} />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Salvar tudo</span>
            </>
          )}
        </button>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}
    </section>
  )
}
