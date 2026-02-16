"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import styles from "./page.module.css"
import { ATTRIBUTE_CATALOG } from "@/lib/rpg/attributeCatalog"
import AdvancedOptionsSection from "./components/advanced-options/AdvancedOptionsSection"
import AttributeOptionsSection from "./components/attribute-options/AttributeOptionsSection"
import EditRpgForm from "./components/edit-rpg-form/EditRpgForm"
import PlayerTemplateFieldsSection from "./components/player-template-fields/PlayerTemplateFieldsSection"
import RaceClassOptionsSection from "./components/race-class-options/RaceClassOptionsSection"
import SkillOptionsSection from "./components/skill-options/SkillOptionsSection"
import StatusOptionsSection from "./components/status-options/StatusOptionsSection"
import type { CatalogOption } from "./components/shared/types"
import { useEditRpgData } from "./hooks/useEditRpgData"
import { useEditRpgState } from "./hooks/useEditRpgState"

const CORE_STATUS_OPTIONS: CatalogOption[] = [
  { key: "life", label: "Vida" },
  { key: "mana", label: "Mana" },
  { key: "sanity", label: "Sanidade" },
  { key: "stamina", label: "Exaustao" },
]

export default function EditRpgPage() {
  const params = useParams<{ rpgId: string }>()
  const router = useRouter()
  const rpgId = params.rpgId
  const state = useEditRpgState()

  const data = useEditRpgData({
    rpgId,
    coreStatusOptions: CORE_STATUS_OPTIONS,
    title: state.title,
    description: state.description,
    visibility: state.visibility,
    useMundiMap: state.useMundiMap,
    useClassRaceBonuses: state.useClassRaceBonuses,
    useInventoryWeightLimit: state.useInventoryWeightLimit,
    selectedAttributeKeys: state.selectedAttributeKeys,
    selectedStatusKeys: state.selectedStatusKeys,
    statusLabelByKey: state.statusLabelByKey,
    skillTemplates: state.skillTemplates,
    characterIdentityTemplates: state.characterIdentityTemplates,
    characterCharacteristicTemplates: state.characterCharacteristicTemplates,
    setTitle: state.setTitle,
    setDescription: state.setDescription,
    setVisibility: state.setVisibility,
    setUseMundiMap: state.setUseMundiMap,
    setUseClassRaceBonuses: state.setUseClassRaceBonuses,
    setUseInventoryWeightLimit: state.setUseInventoryWeightLimit,
    setSelectedAttributeKeys: state.setSelectedAttributeKeys,
    setSelectedStatusKeys: state.setSelectedStatusKeys,
    setStatusLabelByKey: state.setStatusLabelByKey,
    setSkillTemplates: state.setSkillTemplates,
    setRaceDrafts: state.setRaceDrafts,
    setClassDrafts: state.setClassDrafts,
    setCharacterIdentityTemplates: state.setCharacterIdentityTemplates,
    setCharacterCharacteristicTemplates: state.setCharacterCharacteristicTemplates,
  })

  if (data.loading) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p>Carregando RPG...</p>
        </section>
      </main>
    )
  }

  if (!data.canEdit) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>Edicao bloqueada</h1>
          <p className={styles.error}>{data.error || "Voce nao pode editar este RPG."}</p>
          <div className={styles.actions}>
            <Link href="/rpg">
              <ArrowLeft size={16} />
              <span>Voltar para RPGs</span>
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Editar RPG</h1>

        <AdvancedOptionsSection
          showAdvanced={state.showAdvanced}
          onToggle={() => state.setShowAdvanced((prev) => !prev)}
        >
          <AttributeOptionsSection
            showList={state.showAttributeList}
            onToggleList={() => state.setShowAttributeList((prev) => !prev)}
            options={ATTRIBUTE_CATALOG}
            selectedKeys={state.selectedAttributeKeys}
            onToggleItem={state.toggleAttributeKey}
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
            rpgId={rpgId}
            useClassRaceBonuses={state.useClassRaceBonuses}
            onUseClassRaceBonusesChange={state.setUseClassRaceBonuses}
            showRaceList={state.showRaceList}
            onToggleRaceList={() => state.setShowRaceList((prev) => !prev)}
            onCreateRace={() => router.push(`/rpg/${rpgId}/edit/advanced/race/new`)}
            raceDrafts={state.raceDrafts}
            showClassList={state.showClassList}
            onToggleClassList={() => state.setShowClassList((prev) => !prev)}
            onCreateClass={() => router.push(`/rpg/${rpgId}/edit/advanced/class/new`)}
            classDrafts={state.classDrafts}
          />

          {data.identitySuccess ? <p className={styles.success}>{data.identitySuccess}</p> : null}
        </AdvancedOptionsSection>

        <EditRpgForm
          title={state.title}
          onTitleChange={state.setTitle}
          description={state.description}
          onDescriptionChange={state.setDescription}
          visibility={state.visibility}
          onVisibilityChange={state.setVisibility}
          useMundiMap={state.useMundiMap}
          onUseMundiMapChange={state.setUseMundiMap}
          useInventoryWeightLimit={state.useInventoryWeightLimit}
          onUseInventoryWeightLimitChange={state.setUseInventoryWeightLimit}
          error={data.error}
          success={data.identitySuccess}
          saving={data.saving}
          onSaveAll={data.saveAll}
        />
      </section>
    </main>
  )
}
