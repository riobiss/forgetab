"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { startTransition, useState } from "react"
import {
  ArrowLeft,
  DoorOpen,
  Eye,
  Gamepad2,
  Radio,
  Square,
  Trash2,
  Users,
  X
} from "lucide-react"
import type { DashboardCharacterSummary } from "@/features/world/application/dashboard/contracts/RpgDashboardGateway"
import type { RpgCampaignViewModel } from "@forgetab/world-contracts/campaign"
import { httpRpgDashboardGateway } from "@/features/world/infrastructure/dashboard/gateways/httpRpgDashboardGateway"
import {
  clearCampaignPresence,
  clearCampaignSelectedCharacter,
  getCampaignPresence,
  setCampaignSelectedCharacter
} from "@/features/world/campaign/infrastructure/presence/campaignPresence"
import { httpRpgCampaignRepository } from "@/features/world/campaign/infrastructure/repositories/httpRpgCampaignRepository"
import styles from "./RpgCampaignPage.module.css"

function formatDateTime(date: Date | null) {
  if (!date) return "ainda nao iniciada"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  }).format(date)
}

function getCampaignStatus(campaign: {
  isActive: boolean
  endedAt: Date | null
}) {
  if (campaign.isActive) {
    return { label: "Em andamento", className: styles.activeStatus }
  }

  if (campaign.endedAt) {
    return { label: "Finalizado", className: styles.finishedStatus }
  }

  return { label: "Pendente", className: styles.pendingStatus }
}

function getCampaignStatusLabel(campaign: {
  isActive: boolean
  endedAt: Date | null
}) {
  return getCampaignStatus(campaign).label
}

function getCampaignStatusClassName(campaign: {
  isActive: boolean
  endedAt: Date | null
}) {
  return getCampaignStatus(campaign).className
}

type Props = {
  rpgId: string
  rpgTitle: string
  initialViewModel: RpgCampaignViewModel
}

type CampaignCharacterOption = DashboardCharacterSummary & {
  classLabel: string | null
}

export function RpgCampaignPage({ rpgId, rpgTitle, initialViewModel }: Props) {
  const router = useRouter()
  const [viewModel, setViewModel] = useState(initialViewModel)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [entryCampaign, setEntryCampaign] = useState<{
    id: string
    title: string
    shouldJoin: boolean
  } | null>(null)
  const [entryMode, setEntryMode] = useState<"choose" | "play">("choose")
  const [availableCharacters, setAvailableCharacters] = useState<
    CampaignCharacterOption[]
  >([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null
  )

  async function refreshCampaigns() {
    const nextViewModel = await httpRpgCampaignRepository.fetchViewModel(rpgId)
    startTransition(() => {
      setViewModel(nextViewModel)
    })

    const presence = getCampaignPresence()
    if (
      presence?.rpgId === rpgId &&
      !nextViewModel.campaigns.some(
        (campaign) => campaign.id === presence.campaignId
      )
    ) {
      clearCampaignPresence()
      clearCampaignSelectedCharacter(presence.campaignId)
    }
  }

  async function runAction(action: () => Promise<{ message?: string }>) {
    setIsBusy(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = await action()
      await refreshCampaigns()
      setSuccess(payload.message ?? "Acao concluida.")
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel concluir a acao."
      )
    } finally {
      setIsBusy(false)
    }
  }

  function closeEntryModal() {
    setEntryCampaign(null)
    setEntryMode("choose")
    setAvailableCharacters([])
    setSelectedCharacterId(null)
  }

  function persistCampaignCharacter(
    campaignId: string,
    character: CampaignCharacterOption
  ) {
    setCampaignSelectedCharacter(campaignId, {
      id: character.id,
      name: character.name,
      image: character.image ?? null
    })
  }

  function openCampaignEntry(
    campaign: { id: string; title: string },
    shouldJoin: boolean
  ) {
    setError(null)
    setEntryCampaign({ ...campaign, shouldJoin })
    setEntryMode("choose")
    setAvailableCharacters([])
    setSelectedCharacterId(null)
  }

  async function proceedToCampaign(params: {
    campaignId: string
    shouldJoin: boolean
    selectedCharacter?: CampaignCharacterOption | null
  }) {
    setIsBusy(true)
    setError(null)

    try {
      if (params.selectedCharacter) {
        persistCampaignCharacter(params.campaignId, params.selectedCharacter)
      }

      if (params.shouldJoin) {
        await httpRpgCampaignRepository.joinCampaign(rpgId, params.campaignId)
      }

      closeEntryModal()
      router.push(`/rpg/${rpgId}/campaign/${params.campaignId}`)
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel abrir a campanha."
      )
    } finally {
      setIsBusy(false)
    }
  }

  async function handlePlaySelection() {
    if (!entryCampaign) return

    setIsBusy(true)
    setError(null)

    try {
      const [charactersPayload, classesPayload] = await Promise.all([
        httpRpgDashboardGateway.fetchCharacters(rpgId),
        httpRpgDashboardGateway.fetchClasses(rpgId)
      ])
      const classLabelByKey = new Map(
        (classesPayload.classes ?? []).map((classItem) => [
          classItem.key,
          classItem.label
        ])
      )
      const playerCharacters = (charactersPayload.characters ?? [])
        .filter((character) => character.characterType === "player")
        .map((character) => ({
          ...character,
          classLabel: character.classKey
            ? (classLabelByKey.get(character.classKey) ?? character.classKey)
            : null
        }))

      setAvailableCharacters(playerCharacters)
      setSelectedCharacterId(playerCharacters[0]?.id ?? null)
      setEntryMode("play")
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel carregar seus personagens."
      )
    } finally {
      setIsBusy(false)
    }
  }

  function handleEndCampaign(campaign: { id: string; title: string }) {
    if (!window.confirm(`Finalizar a campanha "${campaign.title}"?`)) {
      return
    }

    void runAction(async () => {
      const payload = await httpRpgCampaignRepository.endCampaign(
        rpgId,
        campaign.id
      )
      const presence = getCampaignPresence()
      if (presence?.campaignId === campaign.id) {
        clearCampaignPresence()
      }
      return payload
    })
  }

  function handleDeleteCampaign(campaign: { id: string; title: string }) {
    if (
      !window.confirm(
        `Deletar a campanha "${campaign.title}"? Essa acao nao pode ser desfeita.`
      )
    ) {
      return
    }

    void runAction(async () => {
      const payload = await httpRpgCampaignRepository.deleteCampaign(
        rpgId,
        campaign.id
      )
      const presence = getCampaignPresence()
      if (presence?.campaignId === campaign.id) {
        clearCampaignPresence()
      }
      clearCampaignSelectedCharacter(campaign.id)
      return payload
    })
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{rpgTitle}</p>
            <h1 className={styles.title}>Campanha</h1>
          </div>
        </div>

        {error ? <p className={styles.feedbackError}>{error}</p> : null}
        {success ? <p className={styles.feedbackSuccess}>{success}</p> : null}

        <div className={styles.grid}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Sessões</h2>
            </div>

            {viewModel.isOwner ? (
              <form
                className={styles.createForm}
                onSubmit={(event) => {
                  event.preventDefault()
                  void runAction(async () => {
                    const payload =
                      await httpRpgCampaignRepository.createCampaign(rpgId, {
                        title,
                        description
                      })
                    setTitle("")
                    setDescription("")
                    return payload
                  })
                }}
              >
                <div className={styles.field}>
                  <label htmlFor="campaign-title">Titulo</label>
                  <input
                    id="campaign-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ex.: Os Portoes de Aethel"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="campaign-description">Descricao</label>
                  <textarea
                    id="campaign-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    placeholder="Resumo rapido do momento da campanha, objetivo ou atmosfera."
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isBusy}
                >
                  Criar campanha
                </button>
              </form>
            ) : null}

            <div className={styles.campaignList}>
              {viewModel.campaigns.length === 0 ? (
                <div className={styles.emptyState}>
                  Nenhuma campanha cadastrada ainda. Quando o owner criar uma,
                  ela aparece aqui.
                </div>
              ) : null}

              {viewModel.campaigns.map((campaign) => (
                <article key={campaign.id} className={styles.campaignCard}>
                  <div className={styles.campaignMain}>
                    <div
                      className={styles.campaignMeta}
                      aria-label="Status da campanha"
                    >
                      <span className={getCampaignStatusClassName(campaign)}>
                        <Radio size={14} />
                        {getCampaignStatusLabel(campaign)}
                      </span>
                      <span
                        aria-label={`${campaign.participantsCount} participantes`}
                      >
                        <Users size={14} />
                        {campaign.participantsCount} pessoas
                      </span>
                    </div>

                    <div className={styles.campaignContent}>
                      <h3 className={styles.campaignTitle}>{campaign.title}</h3>
                      <p className={styles.campaignDescription}>
                        {campaign.description}
                      </p>
                    </div>
                  </div>

                  <div className={styles.campaignFooter}>
                    <div className={styles.campaignActions}>
                      {viewModel.isOwner && !campaign.isActive ? (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() =>
                            runAction(async () => {
                              const payload =
                                await httpRpgCampaignRepository.startCampaign(
                                  rpgId,
                                  campaign.id
                                )
                              router.push(
                                `/rpg/${rpgId}/campaign/${campaign.id}`
                              )
                              return payload
                            })
                          }
                          disabled={isBusy}
                        >
                          Comecar campanha
                        </button>
                      ) : null}

                      {campaign.isActive && viewModel.isOwner ? (
                        <Link
                          href={`/rpg/${rpgId}/campaign/${campaign.id}`}
                          className={styles.secondaryButton}
                        >
                          <DoorOpen size={15} />
                          Abrir sala
                        </Link>
                      ) : null}

                      {campaign.isActive && viewModel.isOwner ? (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => handleEndCampaign(campaign)}
                          disabled={isBusy}
                        >
                          <Square size={14} />
                          Finalizar
                        </button>
                      ) : null}

                      {viewModel.isOwner ? (
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => handleDeleteCampaign(campaign)}
                          disabled={isBusy}
                        >
                          <Trash2 size={15} />
                          Deletar
                        </button>
                      ) : null}

                      {campaign.isActive &&
                      !viewModel.isOwner &&
                      campaign.hasJoined ? (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() =>
                            openCampaignEntry(
                              { id: campaign.id, title: campaign.title },
                              false
                            )
                          }
                          disabled={isBusy}
                        >
                          <DoorOpen size={15} />
                          Abrir campanha
                        </button>
                      ) : null}

                      {campaign.isActive &&
                      !viewModel.isOwner &&
                      !campaign.hasJoined &&
                      viewModel.isAcceptedMember ? (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() =>
                            openCampaignEntry(
                              { id: campaign.id, title: campaign.title },
                              true
                            )
                          }
                          disabled={isBusy}
                        >
                          <DoorOpen size={15} />
                          Entrar
                        </button>
                      ) : null}
                    </div>
                    <p className={styles.campaignDate}>
                      <span>Inicio: {formatDateTime(campaign.startedAt)}</span>
                      {campaign.endedAt ? (
                        <span>Fim: {formatDateTime(campaign.endedAt)}</span>
                      ) : null}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {entryCampaign ? (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onClick={closeEntryModal}
          >
            <section
              className={styles.entryModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="campaign-entry-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.entryModalHeader}>
                <div>
                  <p className={styles.eyebrow}>Campanha</p>
                  <h2
                    id="campaign-entry-title"
                    className={styles.entryModalTitle}
                  >
                    {entryCampaign.title}
                  </h2>
                </div>
                <button
                  type="button"
                  className={styles.closeModalButton}
                  onClick={closeEntryModal}
                >
                  <X size={16} />
                </button>
              </div>

              {entryMode === "choose" ? (
                <div className={styles.entryOptions}>
                  <button
                    type="button"
                    className={styles.entryOption}
                    onClick={() => {
                      void proceedToCampaign({
                        campaignId: entryCampaign.id,
                        shouldJoin: entryCampaign.shouldJoin
                      })
                    }}
                    disabled={isBusy}
                  >
                    <Eye size={18} />
                    <strong>Espectar</strong>
                    <span>Entrar sem selecionar personagem por enquanto.</span>
                  </button>

                  <button
                    type="button"
                    className={styles.entryOption}
                    onClick={() => {
                      void handlePlaySelection()
                    }}
                    disabled={isBusy}
                  >
                    <Gamepad2 size={18} />
                    <strong>Jogar</strong>
                    <span>
                      Escolher um dos seus personagens antes de entrar.
                    </span>
                  </button>
                </div>
              ) : (
                <div className={styles.entryStep}>
                  <button
                    type="button"
                    className={styles.backStepButton}
                    onClick={() => setEntryMode("choose")}
                  >
                    <ArrowLeft size={16} />
                    Voltar
                  </button>

                  {availableCharacters.length === 0 ? (
                    <div className={styles.emptyState}>
                      Voce ainda nao possui um personagem de player neste RPG
                      para entrar jogando.
                    </div>
                  ) : (
                    <div className={styles.characterPicker}>
                      {availableCharacters.map((character) => (
                        <label
                          key={character.id}
                          className={styles.characterOption}
                        >
                          <input
                            type="radio"
                            name="campaign-character"
                            checked={selectedCharacterId === character.id}
                            onChange={() =>
                              setSelectedCharacterId(character.id)
                            }
                          />
                          <div>
                            <strong>{character.name}</strong>
                            <small>
                              {character.classKey
                                ? `Classe: ${character.classLabel ?? character.classKey}`
                                : "Sem classe definida"}
                            </small>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className={styles.actionButton}
                    disabled={isBusy || !selectedCharacterId}
                    onClick={() => {
                      const selectedCharacter =
                        availableCharacters.find(
                          (character) => character.id === selectedCharacterId
                        ) ?? null

                      void proceedToCampaign({
                        campaignId: entryCampaign.id,
                        shouldJoin: entryCampaign.shouldJoin,
                        selectedCharacter
                      })
                    }}
                  >
                    Entrar com personagem
                  </button>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  )
}
