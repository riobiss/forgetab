"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, LayoutList, Settings2 } from "lucide-react"
import styles from "./page.module.css"
import AttributeOptionsSection from "./components/attribute-options/AttributeOptionsSection"
import EditRpgForm from "./components/edit-rpg-form/EditRpgForm"
import PlayerTemplateFieldsSection from "./components/player-template-fields/PlayerTemplateFieldsSection"
import RaceClassOptionsSection from "./components/race-class-options/RaceClassOptionsSection"
import SkillOptionsSection from "./components/skill-options/SkillOptionsSection"
import StatusOptionsSection from "./components/status-options/StatusOptionsSection"
import type { CatalogOption } from "./components/shared/types"
import { useEditRpgData } from "./hooks/useEditRpgData"
import { useEditRpgState } from "./hooks/useEditRpgState"
import { useState } from "react"
import RadixSwitchField from "./components/shared/RadixSwitchField"

const CORE_STATUS_OPTIONS: CatalogOption[] = [
  { key: "life", label: "Vida" },
  { key: "mana", label: "Mana" },
  { key: "sanity", label: "Sanidade" },
  { key: "stamina", label: "Exaustao" },
]

type UploadImagePayload = {
  message?: string
  url?: string
}

export default function EditRpgPage() {
  const params = useParams<{ rpgId: string }>()
  const router = useRouter()
  const rpgId = params.rpgId
  const state = useEditRpgState()
  const [activeStage, setActiveStage] = useState<"basic" | "advanced">("basic")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState("")

  const data = useEditRpgData({
    rpgId,
    coreStatusOptions: CORE_STATUS_OPTIONS,
    title: state.title,
    description: state.description,
    image: state.image,
    visibility: state.visibility,
    useMundiMap: state.useMundiMap,
    useClassRaceBonuses: state.useClassRaceBonuses,
    useInventoryWeightLimit: state.useInventoryWeightLimit,
    attributeTemplates: state.attributeTemplates,
    selectedStatusKeys: state.selectedStatusKeys,
    statusLabelByKey: state.statusLabelByKey,
    skillTemplates: state.skillTemplates,
    characterIdentityTemplates: state.characterIdentityTemplates,
    characterCharacteristicTemplates: state.characterCharacteristicTemplates,
    setTitle: state.setTitle,
    setDescription: state.setDescription,
    setImage: state.setImage,
    setVisibility: state.setVisibility,
    setUseMundiMap: state.setUseMundiMap,
    setUseClassRaceBonuses: state.setUseClassRaceBonuses,
    setUseInventoryWeightLimit: state.setUseInventoryWeightLimit,
    setCostsEnabled: state.setCostsEnabled,
    setCostResourceName: state.setCostResourceName,
    setAttributeTemplates: state.setAttributeTemplates,
    setSelectedStatusKeys: state.setSelectedStatusKeys,
    setStatusLabelByKey: state.setStatusLabelByKey,
    setSkillTemplates: state.setSkillTemplates,
    setRaceDrafts: state.setRaceDrafts,
    setClassDrafts: state.setClassDrafts,
    setCharacterIdentityTemplates: state.setCharacterIdentityTemplates,
    setCharacterCharacteristicTemplates: state.setCharacterCharacteristicTemplates,
  })

  async function handleDeleteRpg() {
    const confirmed = window.confirm(
      "Tem certeza que deseja deletar este RPG? Esta acao nao pode ser desfeita.",
    )
    if (!confirmed) return

    const result = await data.deleteRpg()
    if (result.ok) {
      router.push("/rpg")
      router.refresh()
    }
  }

  async function handleImageUpload(file: File) {
    setUploadingImage(true)
    setUploadError("")

    try {
      const payload = new FormData()
      payload.append("file", file)

      const response = await fetch("/api/uploads/rpg-image", {
        method: "POST",
        body: payload,
      })

      const body = (await response.json()) as UploadImagePayload
      if (!response.ok || !body.url) {
        setUploadError(body.message ?? "Nao foi possivel enviar imagem.")
        return
      }

      state.setImage(body.url)
    } catch {
      setUploadError("Erro de conexao ao enviar imagem.")
    } finally {
      setUploadingImage(false)
    }
  }

  function handleRemoveImage() {
    state.setImage("")
    setUploadError("")
  }

  if (data.loading) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p>Carregando...</p>
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
        <div className={styles.stageTabs} role="tablist" aria-label="Etapas de edicao do RPG">
          <button
            type="button"
            role="tab"
            aria-selected={activeStage === "basic"}
            className={`${styles.stageTab} ${activeStage === "basic" ? styles.stageTabActive : ""}`}
            onClick={() => setActiveStage("basic")}
          >
            <LayoutList size={15} />
            Basico
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeStage === "advanced"}
            className={`${styles.stageTab} ${activeStage === "advanced" ? styles.stageTabActive : ""}`}
            onClick={() => setActiveStage("advanced")}
          >
            <Settings2 size={15} />
            Avancado
          </button>
        </div>

        {activeStage === "basic" ? (
          <EditRpgForm
            title={state.title}
            onTitleChange={state.setTitle}
          description={state.description}
          onDescriptionChange={state.setDescription}
          image={state.image}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
            uploadingImage={uploadingImage}
            uploadError={uploadError}
            visibility={state.visibility}
            onVisibilityChange={state.setVisibility}
            error={data.error}
            success={data.identitySuccess}
            saving={data.saving}
            deleting={data.deleting}
            onSaveAll={data.saveAll}
            onDeleteRpg={handleDeleteRpg}
          />
        ) : (
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
                state.useInventoryWeightLimit ? "Peso limitado habilitado" : "Sem limite de peso"
              }
              checked={state.useInventoryWeightLimit}
              onCheckedChange={state.setUseInventoryWeightLimit}
            />

            <div className={styles.field}>
              <span>
                <Eye size={14} />
                Custos (somente leitura)
              </span>
              <input value={state.costsEnabled ? "Ativado" : "Desativado"} readOnly />
              <input value={state.costResourceName} readOnly />
              <p className={styles.error}>Configuracao disponivel apenas na criacao do RPG.</p>
            </div>

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
              onRaceDraftsChange={state.setRaceDrafts}
              showClassList={state.showClassList}
              onToggleClassList={() => state.setShowClassList((prev) => !prev)}
              onCreateClass={() => router.push(`/rpg/${rpgId}/edit/advanced/class/new`)}
              classDrafts={state.classDrafts}
              onClassDraftsChange={state.setClassDrafts}
            />

            {data.error ? <p className={styles.error}>{data.error}</p> : null}
            {data.identitySuccess ? <p className={styles.success}>{data.identitySuccess}</p> : null}
          </section>
        )}
      </section>
    </main>
  )
}
