"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { startTransition, useState } from "react"
import { ArrowLeft, DoorOpen, Eye, Gamepad2, Radio, Users, X } from "lucide-react"
import type { DashboardCharacterSummary } from "@/application/rpgDashboard/contracts/RpgDashboardGateway"
import { formatDateInBrasilia } from "@/lib/date"
import type { RpgCampaignViewModel } from "@/application/rpgCampaign/types"
import { httpRpgDashboardGateway } from "@/infrastructure/rpgDashboard/gateways/httpRpgDashboardGateway"
import { setCampaignSelectedCharacter } from "@/infrastructure/rpgCampaign/campaignPresence"
import { httpRpgCampaignRepository } from "@/infrastructure/rpgCampaign/repositories/httpRpgCampaignRepository"
import styles from "./RpgCampaignPage.module.css"

function formatDateTime(date: Date | null) {
  if (!date) return "Ainda nao iniciada"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date)
}

type Props = {
  rpgId: string
  rpgTitle: string
  initialViewModel: RpgCampaignViewModel
}

export function RpgCampaignPage({ rpgId, rpgTitle, initialViewModel }: Props) {
  const router = useRouter()
  const [viewModel, setViewModel] = useState(initialViewModel)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [entryCampaign, setEntryCampaign] = useState<{ id: string; title: string; shouldJoin: boolean } | null>(null)
  const [entryMode, setEntryMode] = useState<"choose" | "play">("choose")
  const [availableCharacters, setAvailableCharacters] = useState<DashboardCharacterSummary[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)

  const activeCampaign =
    viewModel.campaigns.find((campaign) => campaign.id === viewModel.activeCampaignId) ?? null

  async function refreshCampaigns() {
    const nextViewModel = await httpRpgCampaignRepository.fetchViewModel(rpgId)
    startTransition(() => {
      setViewModel(nextViewModel)
    })
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
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel concluir a acao.")
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

  function persistCampaignCharacter(campaignId: string, character: DashboardCharacterSummary) {
    setCampaignSelectedCharacter(campaignId, {
      id: character.id,
      name: character.name,
      image: character.image ?? null,
    })
  }

  function openCampaignEntry(campaign: { id: string; title: string }, shouldJoin: boolean) {
    setError(null)
    setEntryCampaign({ ...campaign, shouldJoin })
    setEntryMode("choose")
    setAvailableCharacters([])
    setSelectedCharacterId(null)
  }

  async function proceedToCampaign(params: {
    campaignId: string
    shouldJoin: boolean
    selectedCharacter?: DashboardCharacterSummary | null
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
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel abrir a campanha.")
    } finally {
      setIsBusy(false)
    }
  }

  async function handlePlaySelection() {
    if (!entryCampaign) return

    setIsBusy(true)
    setError(null)

    try {
      const payload = await httpRpgDashboardGateway.fetchCharacters(rpgId)
      const playerCharacters = (payload.characters ?? []).filter(
        (character) => character.characterType === "player",
      )

      setAvailableCharacters(playerCharacters)
      setSelectedCharacterId(playerCharacters[0]?.id ?? null)
      setEntryMode("play")
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel carregar seus personagens.")
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>RPG / Campanha</p>
            <h1 className={styles.title}>{rpgTitle}</h1>
            <p className={styles.subtitle}>
              Area para organizar campanhas, iniciar uma partida em andamento e abrir o chat entre quem entrou nela.
            </p>
          </div>
          <Link href={`/rpg/${rpgId}`} className={styles.backLink}>
            Voltar ao RPG
          </Link>
        </div>

        {activeCampaign ? (
          <section className={styles.statusBanner}>
            <div>
              <strong>Campanha em andamento</strong>
              <p>{activeCampaign.title}</p>
            </div>

            {!viewModel.isOwner && viewModel.isAcceptedMember && !viewModel.viewerJoinedActiveCampaign ? (
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => openCampaignEntry({ id: activeCampaign.id, title: activeCampaign.title }, true)}
                disabled={isBusy}
              >
                Entrar
              </button>
            ) : null}

            {viewModel.isOwner && activeCampaign ? (
              <Link href={`/rpg/${rpgId}/campaign/${activeCampaign.id}`} className={styles.actionButton}>
                Abrir sala
              </Link>
            ) : null}

            {!viewModel.isOwner && viewModel.viewerJoinedActiveCampaign && activeCampaign ? (
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => openCampaignEntry({ id: activeCampaign.id, title: activeCampaign.title }, false)}
                disabled={isBusy}
              >
                Abrir campanha
              </button>
            ) : null}
          </section>
        ) : null}

        {error ? <p className={styles.feedbackError}>{error}</p> : null}
        {success ? <p className={styles.feedbackSuccess}>{success}</p> : null}

        <div className={styles.grid}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Campanhas</h2>
            </div>

            {viewModel.isOwner ? (
              <form
                className={styles.createForm}
                onSubmit={(event) => {
                  event.preventDefault()
                  void runAction(async () => {
                    const payload = await httpRpgCampaignRepository.createCampaign(rpgId, {
                      title,
                      description,
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

                <button type="submit" className={styles.submitButton} disabled={isBusy}>
                  Criar campanha
                </button>
              </form>
            ) : null}

            <div className={styles.campaignList}>
              {viewModel.campaigns.length === 0 ? (
                <div className={styles.emptyState}>
                  Nenhuma campanha cadastrada ainda. Quando o owner criar uma, ela aparece aqui.
                </div>
              ) : null}

              {viewModel.campaigns.map((campaign) => (
                <article key={campaign.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div>
                      <h3>{campaign.title}</h3>
                      <div className={styles.meta}>
                        <span className={`${styles.pill} ${campaign.isActive ? styles.pillActive : ""}`}>
                          <Radio size={14} />
                          {campaign.isActive ? "Em andamento" : "Pendente"}
                        </span>
                        <span className={styles.pill}>
                          <Users size={14} />
                          {campaign.participantsCount} participantes
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className={styles.cardDescription}>{campaign.description}</p>

                  <div className={styles.cardFooter}>
                    <p className={styles.muted}>
                      Criada em {formatDateInBrasilia(campaign.createdAt)}. Inicio: {formatDateTime(campaign.startedAt)}
                    </p>

                    {viewModel.isOwner && !campaign.isActive ? (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() =>
                          runAction(async () => {
                            const payload = await httpRpgCampaignRepository.startCampaign(rpgId, campaign.id)
                            router.push(`/rpg/${rpgId}/campaign/${campaign.id}`)
                            return payload
                          })
                        }
                        disabled={isBusy}
                      >
                        Comecar campanha
                      </button>
                    ) : null}

                    {(campaign.isActive && viewModel.isOwner) ? (
                      <Link href={`/rpg/${rpgId}/campaign/${campaign.id}`} className={styles.secondaryButton}>
                        <DoorOpen size={15} />
                        Abrir sala
                      </Link>
                    ) : null}

                    {campaign.isActive && !viewModel.isOwner && campaign.hasJoined ? (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => openCampaignEntry({ id: campaign.id, title: campaign.title }, false)}
                        disabled={isBusy}
                      >
                        <DoorOpen size={15} />
                        Abrir campanha
                      </button>
                    ) : null}

                    {campaign.isActive && !viewModel.isOwner && !campaign.hasJoined && viewModel.isAcceptedMember ? (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => openCampaignEntry({ id: campaign.id, title: campaign.title }, true)}
                        disabled={isBusy}
                      >
                        <DoorOpen size={15} />
                        Entrar
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {entryCampaign ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={closeEntryModal}>
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
                  <h2 id="campaign-entry-title" className={styles.entryModalTitle}>
                    {entryCampaign.title}
                  </h2>
                </div>
                <button type="button" className={styles.closeModalButton} onClick={closeEntryModal}>
                  <X size={16} />
                </button>
              </div>

              {entryMode === "choose" ? (
                <div className={styles.entryOptions}>
                  <button
                    type="button"
                    className={styles.entryOption}
                    onClick={() => {
                      void proceedToCampaign({ campaignId: entryCampaign.id, shouldJoin: entryCampaign.shouldJoin })
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
                    <span>Escolher um dos seus personagens antes de entrar.</span>
                  </button>
                </div>
              ) : (
                <div className={styles.entryStep}>
                  <button type="button" className={styles.backStepButton} onClick={() => setEntryMode("choose")}>
                    <ArrowLeft size={16} />
                    Voltar
                  </button>

                  {availableCharacters.length === 0 ? (
                    <div className={styles.emptyState}>
                      Voce ainda nao possui um personagem de player neste RPG para entrar jogando.
                    </div>
                  ) : (
                    <div className={styles.characterPicker}>
                      {availableCharacters.map((character) => (
                        <label key={character.id} className={styles.characterOption}>
                          <input
                            type="radio"
                            name="campaign-character"
                            checked={selectedCharacterId === character.id}
                            onChange={() => setSelectedCharacterId(character.id)}
                          />
                          <div>
                            <strong>{character.name}</strong>
                            <small>{character.classKey ? `Classe: ${character.classKey}` : "Sem classe definida"}</small>
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
                        availableCharacters.find((character) => character.id === selectedCharacterId) ?? null

                      void proceedToCampaign({
                        campaignId: entryCampaign.id,
                        shouldJoin: entryCampaign.shouldJoin,
                        selectedCharacter,
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
