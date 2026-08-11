"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, LayoutList, Settings2, Shield } from "lucide-react"
import { toast } from "react-hot-toast"
import {
  deleteRpgImageByUrlUseCase,
  uploadRpgImageUseCase
} from "@/features/world/application/editor/use-cases/rpgEditor"
import { createRpgEditorDependencies } from "@/features/world/presentation/editor/dependencies"
import { useEditRpgData } from "@/features/world/presentation/editor/useEditRpgData"
import { dismissToast } from "@/shared/presentation/notifications/toast"
import EditRpgAdvancedStage, {
  CORE_STATUS_OPTIONS
} from "./components/EditRpgAdvancedStage"
import EditRpgForm from "./components/edit-rpg-form/EditRpgForm"
import RadixSwitchField from "./components/shared/RadixSwitchField"
import { useEditRpgState } from "./hooks/useEditRpgState"
import styles from "./page.module.css"

type EditorStage = "basic" | "advanced" | "permissions"

type EditRpgFeatureProps = {
  deps?: ReturnType<typeof createRpgEditorDependencies>
  presentation?: "standalone" | "embedded"
  onClose?: () => void
  onSaved?: () => void
  onDeleted?: () => void
}

const STAGES: Array<{
  key: EditorStage
  label: string
  Icon: typeof LayoutList
}> = [
  { key: "basic", label: "Basico", Icon: LayoutList },
  { key: "advanced", label: "Avancado", Icon: Settings2 },
  { key: "permissions", label: "Permissoes", Icon: Shield }
]

export default function EditRpgFeature({
  deps: providedDeps,
  presentation = "standalone",
  onClose,
  onSaved,
  onDeleted
}: EditRpgFeatureProps = {}) {
  const params = useParams<{ rpgId: string }>()
  const router = useRouter()
  const rpgId = params.rpgId
  const state = useEditRpgState()
  const deps = useMemo(
    () => providedDeps ?? createRpgEditorDependencies("http"),
    [providedDeps]
  )
  const [activeStage, setActiveStage] = useState<EditorStage>("basic")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)

  const data = useEditRpgData({
    deps,
    rpgId,
    coreStatusOptions: CORE_STATUS_OPTIONS,
    title: state.title,
    description: state.description,
    image: state.image,
    visibility: state.visibility,
    useMundiMap: state.useMundiMap,
    useRaceBonuses: state.useRaceBonuses,
    useClassBonuses: state.useClassBonuses,
    useInventoryWeightLimit: state.useInventoryWeightLimit,
    allowMultiplePlayerCharacters: state.allowMultiplePlayerCharacters,
    usersCanManageOwnXp: state.usersCanManageOwnXp,
    allowSkillPointDistribution: state.allowSkillPointDistribution,
    abilityCategoriesEnabled: state.abilityCategoriesEnabled,
    enabledAbilityCategories: state.enabledAbilityCategories,
    progressionMode: state.progressionMode,
    progressionTiers: state.progressionTiers,
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
    setUseRaceBonuses: state.setUseRaceBonuses,
    setUseClassBonuses: state.setUseClassBonuses,
    setUseInventoryWeightLimit: state.setUseInventoryWeightLimit,
    setAllowMultiplePlayerCharacters: state.setAllowMultiplePlayerCharacters,
    setUsersCanManageOwnXp: state.setUsersCanManageOwnXp,
    setAllowSkillPointDistribution: state.setAllowSkillPointDistribution,
    setAbilityCategoriesEnabled: state.setAbilityCategoriesEnabled,
    setEnabledAbilityCategories: state.setEnabledAbilityCategories,
    setProgressionMode: state.setProgressionMode,
    setProgressionTiers: state.setProgressionTiers,
    setCostsEnabled: state.setCostsEnabled,
    setCostResourceName: state.setCostResourceName,
    setAttributeTemplates: state.setAttributeTemplates,
    setSelectedStatusKeys: state.setSelectedStatusKeys,
    setStatusLabelByKey: state.setStatusLabelByKey,
    setSkillTemplates: state.setSkillTemplates,
    setRaceDrafts: state.setRaceDrafts,
    setClassDrafts: state.setClassDrafts,
    setCharacterIdentityTemplates: state.setCharacterIdentityTemplates,
    setCharacterCharacteristicTemplates:
      state.setCharacterCharacteristicTemplates
  })

  async function handleDeleteRpg() {
    if (
      !window.confirm(
        "Tem certeza que deseja deletar este RPG? Esta acao nao pode ser desfeita."
      )
    ) {
      return
    }

    const toastId = toast.loading("Deletando RPG...")
    const result = await data.deleteRpg()
    dismissToast(toastId)
    if (!result.ok) {
      toast.error("Nao foi possivel deletar o RPG.")
      return
    }

    toast.success("RPG deletado com sucesso.")
    onDeleted?.()
    router.push("/rpg")
    router.refresh()
  }

  async function handleSaveAll() {
    setUploadError("")
    const toastId = toast.loading("Salvando RPG...")
    const previousImage = state.image.trim()
    let uploadedImageUrl = ""

    try {
      if (selectedImageFile) {
        setUploadingImage(true)
        const upload = await uploadRpgImageUseCase(deps, {
          file: selectedImageFile
        })
        uploadedImageUrl = upload.url
        state.setImage(upload.url)
      }

      const saved = await data.saveAll(uploadedImageUrl || undefined)
      if (!saved) {
        if (uploadedImageUrl) {
          await rollbackFreshImage(uploadedImageUrl, previousImage)
        }
        toast.error(data.error || "Nao foi possivel salvar o RPG.")
        return
      }

      setSelectedImageFile(null)
      toast.success("RPG salvo com sucesso.")
      onSaved?.()
    } catch (cause) {
      if (uploadedImageUrl) {
        await rollbackFreshImage(uploadedImageUrl, previousImage)
      }
      const message =
        cause instanceof Error ? cause.message : "Nao foi possivel salvar o RPG."
      setUploadError(message)
      toast.error(message)
    } finally {
      dismissToast(toastId)
      setUploadingImage(false)
    }
  }

  async function rollbackFreshImage(url: string, previousImage: string) {
    try {
      await deleteRpgImageByUrlUseCase(deps, { url })
    } catch {
      // A falha de limpeza nao deve esconder o erro original de salvamento.
    }
    state.setImage(previousImage)
  }

  const pageClassName = presentation === "embedded" ? undefined : styles.page

  if (data.loading) {
    return (
      <main className={pageClassName}>
        <section className={styles.card}>
          <p>Carregando...</p>
        </section>
      </main>
    )
  }

  if (!data.canEdit) {
    return (
      <main className={pageClassName}>
        <section className={styles.card}>
          <h1>Edicao bloqueada</h1>
          <p className={styles.error}>
            {data.error || "Voce nao pode editar este RPG."}
          </p>
          <div className={styles.actions}>
            {presentation === "embedded" ? (
              <button type="button" onClick={onClose}>
                <ArrowLeft size={16} /> <span>Fechar</span>
              </button>
            ) : (
              <Link href="/rpg">
                <ArrowLeft size={16} /> <span>Voltar para RPGs</span>
              </Link>
            )}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={pageClassName}>
      <section className={styles.card}>
        <h1>Editar RPG</h1>
        <div
          className={styles.stageTabs}
          role="tablist"
          aria-label="Etapas de edicao do RPG"
        >
          {STAGES.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeStage === key}
              className={`${styles.stageTab} ${activeStage === key ? styles.stageTabActive : ""}`}
              onClick={() => setActiveStage(key)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {activeStage === "basic" ? (
          <EditRpgForm
            title={state.title}
            onTitleChange={state.setTitle}
            description={state.description}
            onDescriptionChange={state.setDescription}
            image={state.image}
            onImageUpload={async (file) => {
              setSelectedImageFile(file)
              setUploadError("")
            }}
            onRemoveImage={() => {
              setSelectedImageFile(null)
              state.setImage("")
              setUploadError("")
            }}
            uploadingImage={uploadingImage}
            uploadError={uploadError}
            visibility={state.visibility}
            onVisibilityChange={state.setVisibility}
            error={data.error}
            success={data.identitySuccess}
            saving={data.saving}
            deleting={data.deleting}
            canDelete={data.canDelete}
            onSaveAll={handleSaveAll}
            onDeleteRpg={handleDeleteRpg}
          />
        ) : activeStage === "advanced" ? (
          <EditRpgAdvancedStage
            state={state}
            deps={deps}
            rpgId={rpgId}
            saving={data.saving}
            error={data.error}
            success={data.identitySuccess}
            onSave={handleSaveAll}
            onOpenRaces={() => router.push(`/rpg/${rpgId}/races`)}
            onOpenClasses={() => router.push(`/rpg/${rpgId}/classes`)}
          />
        ) : (
          <section className={styles.advancedStage}>
            <h2>Permissoes de Progressao e Membros</h2>
            <RadixSwitchField
              id="edit-rpg-allow-multiple-player-characters"
              label="Permitir mais de 1 personagem por player"
              description={
                state.allowMultiplePlayerCharacters
                  ? "Ativo: players podem criar personagens adicionais."
                  : "Inativo: cada player pode ter apenas 1 personagem."
              }
              checked={state.allowMultiplePlayerCharacters}
              onCheckedChange={state.setAllowMultiplePlayerCharacters}
            />
            <RadixSwitchField
              id="edit-rpg-users-can-manage-xp"
              label="Usuarios podem ver os niveis"
              description={
                state.usersCanManageOwnXp
                  ? "Ativo: jogadores podem ajustar XP do proprio personagem."
                  : "Inativo: mestre/moderador controlam XP dos jogadores."
              }
              checked={state.usersCanManageOwnXp}
              onCheckedChange={state.setUsersCanManageOwnXp}
            />
          </section>
        )}
      </section>
    </main>
  )
}
