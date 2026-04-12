"use client"

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, ChevronsDown, MessageCircle, Star, UserRound, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import type { CharacterDetailViewModel } from "@/application/charactersDetail/types"
import type { DashboardCharacterSummary } from "@/application/rpgDashboard/contracts/RpgDashboardGateway"
import type { RpgCampaignRoomViewModel } from "@/application/rpgCampaign/types"
import { getClientAuthToken } from "@/infrastructure/auth/session/clientAuthSession"
import { fetchCharacterDetailViewModel } from "@/infrastructure/charactersDetail/repositories/httpCharacterDetailRepository"
import { getConfiguredApiBaseUrl } from "@/infrastructure/http/backendUrls"
import { httpRpgDashboardGateway } from "@/infrastructure/rpgDashboard/gateways/httpRpgDashboardGateway"
import {
  clearCampaignPresence,
  getCampaignSelectedCharacter,
  setCampaignPresence,
  type CampaignSelectedCharacter,
} from "@/infrastructure/rpgCampaign/campaignPresence"
import { httpRpgCampaignRepository } from "@/infrastructure/rpgCampaign/repositories/httpRpgCampaignRepository"
import { buildCharacterRevealActionContent, getActionCombatId } from "./actionMessages"
import { CampaignActionControls } from "./CampaignActionControls"
import { CampaignActionMessageCard } from "./CampaignActionMessageCard"
import { CampaignChatPanel } from "./CampaignChatPanel"
import { CampaignCombatPanel } from "./CampaignCombatPanel"
import { CampaignCreatureCombatModal } from "./CampaignCreatureCombatModal"
import { CampaignNotePanel } from "./CampaignNotePanel"
import { CharacterRevealModal } from "./CharacterRevealModal"
import {
  buildCharacterRevealSections,
  createInitialCharacterRevealFields,
  type CharacterRevealField,
} from "./characterRevealActionMapper"
import { OwnerCharacterPickerModal, type OwnerCharacterPickerMode } from "./OwnerCharacterPickerModal"
import styles from "./RpgCampaignRoomPage.module.css"
import { useCampaignRoomActions } from "./useCampaignRoomActions"

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date)
}

type Props = {
  rpgId: string
  initialRoom: RpgCampaignRoomViewModel
}

export function RpgCampaignRoomPage({ rpgId, initialRoom }: Props) {
  const router = useRouter()
  const [room, setRoom] = useState(initialRoom)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<CampaignSelectedCharacter | null>(null)
  const [activeCombatRoomId, setActiveCombatRoomId] = useState<string | null>(null)
  const [isCreateCombatModalOpen, setIsCreateCombatModalOpen] = useState(false)
  const [isCreatureCombatModalOpen, setIsCreatureCombatModalOpen] = useState(false)
  const [isOwnerCharacterModalOpen, setIsOwnerCharacterModalOpen] = useState(false)
  const [ownerCharacterMode, setOwnerCharacterMode] = useState<OwnerCharacterPickerMode | null>(null)
  const [ownerCharacters, setOwnerCharacters] = useState<DashboardCharacterSummary[]>([])
  const [isLoadingOwnerCharacters, setIsLoadingOwnerCharacters] = useState(false)
  const [revealCharacter, setRevealCharacter] = useState<CharacterDetailViewModel | null>(null)
  const [revealFields, setRevealFields] = useState<Record<CharacterRevealField, boolean>>(
    createInitialCharacterRevealFields,
  )
  const [isLoadingRevealCharacter, setIsLoadingRevealCharacter] = useState(false)
  const [combatName, setCombatName] = useState("")
  const refreshInFlightRef = useRef(false)
  const actionStreamEndRef = useRef<HTMLDivElement | null>(null)
  const previousActionStreamKeyRef = useRef<string | null>(null)
  const previousLatestActionMessageIdRef = useRef<string | null>(null)
  const isNearLatestActionRef = useRef(true)
  const [showLatestActionButton, setShowLatestActionButton] = useState(false)
  const [newActionCount, setNewActionCount] = useState(0)

  const isCampaignEnded = !room.campaign.isActive

  function appendMessageLocally(message: RpgCampaignRoomViewModel["campaignMessages"][number]) {
    startTransition(() => {
      setRoom((currentRoom) => {
        if (message.kind === "campaign") {
          return {
            ...currentRoom,
            campaignMessages: [...currentRoom.campaignMessages, message],
          }
        }

        if (message.kind === "action") {
          return {
            ...currentRoom,
            actionMessages: [...currentRoom.actionMessages, message],
          }
        }

        return {
          ...currentRoom,
          directMessages: [...currentRoom.directMessages, message],
        }
      })
    })
  }

  const refreshRoom = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return
    }

    refreshInFlightRef.current = true
    try {
      const nextRoom = await httpRpgCampaignRepository.fetchRoomViewModel(rpgId, room.campaign.id)
      startTransition(() => {
        setRoom(nextRoom)
      })
    } finally {
      refreshInFlightRef.current = false
    }
  }, [rpgId, room.campaign.id])

  useEffect(() => {
    const token = getClientAuthToken()
    if (!token) {
      return
    }

    const socket: Socket = io(getConfiguredApiBaseUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: { token },
      withCredentials: true,
    })

    const joinRoom = () => {
      socket.emit("campaign:join-room", {
        rpgId,
        campaignId: initialRoom.campaign.id,
      })
    }

    socket.on("connect", joinRoom)
    socket.on("campaign:refresh", async (payload: { campaignId?: string }) => {
      if (payload.campaignId !== initialRoom.campaign.id) {
        return
      }

      try {
        await refreshRoom()
      } catch {
        // Keep the current UI responsive even if one refresh fails.
      }
    })

    return () => {
      socket.off("connect", joinRoom)
      socket.disconnect()
    }
  }, [initialRoom.campaign.id, refreshRoom, rpgId])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshRoom().catch(() => {
        // Socket remains the primary path; polling is a quiet fallback.
      })
    }, 2500)

    return () => {
      window.clearInterval(interval)
    }
  }, [refreshRoom])

  async function runAction(action: () => Promise<{ message?: string }>) {
    setIsBusy(true)
    setError(null)
    setSuccess(null)

    try {
      await action()
      await refreshRoom()
      return true
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel concluir a acao.")
      return false
    } finally {
      setIsBusy(false)
    }
  }

  const campaignActions = useCampaignRoomActions({
    rpgId,
    room,
    activeCombatRoomId,
    selectedCharacter,
    setError,
    runAction,
    appendMessageLocally,
    setRoom,
  })

  useEffect(() => {
    setSelectedCharacter(getCampaignSelectedCharacter(room.campaign.id))
  }, [room.campaign.id])

  useEffect(() => {
    if (room.campaign.isActive) {
      setCampaignPresence({
        rpgId,
        campaignId: room.campaign.id,
        title: room.campaign.title,
      })
      return
    }

    clearCampaignPresence()
  }, [room.campaign.id, room.campaign.isActive, room.campaign.title, rpgId])

  function handleOpenCharacterSheet() {
    if (!selectedCharacter) {
      setError("Selecione um personagem para abrir a ficha.")
      return
    }

    router.push(`/rpg/${rpgId}/characters/${selectedCharacter.id}`)
  }

  async function openOwnerCharacterPicker() {
    setIsOwnerCharacterModalOpen(true)
    setOwnerCharacterMode("player")

    if (ownerCharacters.length > 0) {
      return
    }

    setIsLoadingOwnerCharacters(true)
    setError(null)

    try {
      const [charactersPayload, classesPayload] = await Promise.all([
        httpRpgDashboardGateway.fetchCharacters(rpgId),
        httpRpgDashboardGateway.fetchClasses(rpgId),
      ])
      const classLabelByKey = new Map((classesPayload.classes ?? []).map((classItem) => [classItem.key, classItem.label]))
      setOwnerCharacters(
        (charactersPayload.characters ?? []).map((character) => ({
          ...character,
          classLabel: character.classKey ? classLabelByKey.get(character.classKey) ?? character.classKey : null,
        })),
      )
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel carregar os personagens.")
    } finally {
      setIsLoadingOwnerCharacters(false)
    }
  }

  function openCharacterDetail(characterId: string) {
    setIsOwnerCharacterModalOpen(false)
    router.push(`/rpg/${rpgId}/characters/${characterId}`)
  }

  async function openRevealCharacterPanel(characterId: string) {
    setIsLoadingRevealCharacter(true)
    setError(null)

    try {
      const character = await fetchCharacterDetailViewModel(rpgId, characterId)
      if (character.characterType === "player") {
        setError("Somente NPC ou Criatura pode ser revelado na sala por aqui.")
        return
      }

      setRevealCharacter(character)
      setRevealFields(createInitialCharacterRevealFields())
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel carregar esse personagem.")
    } finally {
      setIsLoadingRevealCharacter(false)
    }
  }

  async function revealCharacterInRoom() {
    if (!revealCharacter || revealCharacter.characterType === "player") {
      return
    }

    const content = buildCharacterRevealActionContent({
      type: "character_reveal",
      combatId: activeCombatRoomId,
      characterId: revealCharacter.characterId,
      characterName: revealCharacter.displayName,
      characterType: revealCharacter.characterType,
      image: revealCharacter.image,
      sections: buildCharacterRevealSections(revealCharacter, revealFields),
    })

    await runAction(async () => {
      const payload = await httpRpgCampaignRepository.sendMessage(rpgId, room.campaign.id, {
        content,
        kind: "action",
      })

      if ("chatMessage" in payload && payload.chatMessage) {
        appendMessageLocally(payload.chatMessage)
      }

      setRevealCharacter(null)
      setIsOwnerCharacterModalOpen(false)
      return payload
    })
  }

  async function createCombatRoom() {
    await runAction(async () => {
      const payload = await httpRpgCampaignRepository.createCombat(rpgId, room.campaign.id, {
        name: combatName,
      })
      if (payload.combatId) {
        setActiveCombatRoomId(payload.combatId)
      }
      setCombatName("")
      setIsCreateCombatModalOpen(false)
      return payload
    })
  }

  async function joinCombatRoom(roomId: string, role: "spectator" | "fighter") {
    await runAction(() =>
      httpRpgCampaignRepository.joinCombat(rpgId, room.campaign.id, roomId, {
        role,
        characterId: selectedCharacter?.id ?? null,
      }),
    )
  }

  async function createCombatQueue(roomId: string) {
    await runAction(() => httpRpgCampaignRepository.createCombatQueue(rpgId, room.campaign.id, roomId))
  }

  async function moveCombatQueueEntry(roomId: string, entryId: string, direction: -1 | 1) {
    await runAction(() =>
      httpRpgCampaignRepository.moveCombatQueueEntry(rpgId, room.campaign.id, roomId, entryId, direction),
    )
  }

  async function passCombatTurn(roomId: string) {
    await runAction(() => httpRpgCampaignRepository.passCombatTurn(rpgId, room.campaign.id, roomId))
  }

  const visibleActionMessages = useMemo(() => room.actionMessages.filter((message) => {
    const messageCombatId = getActionCombatId(message.content)
    return activeCombatRoomId ? messageCombatId === activeCombatRoomId : !messageCombatId
  }), [activeCombatRoomId, room.actionMessages])
  const latestVisibleActionMessageId = visibleActionMessages.at(-1)?.id ?? null
  const visibleActionMessageIds = useMemo(
    () => visibleActionMessages.map((message) => message.id),
    [visibleActionMessages],
  )
  const actionStreamKey = activeCombatRoomId ?? "campaign"

  const isNearLatestAction = useCallback(() => {
    const marker = actionStreamEndRef.current
    if (!marker) {
      return true
    }

    return marker.getBoundingClientRect().bottom - window.innerHeight < 260
  }, [])

  const scrollToLatestAction = useCallback((behavior: ScrollBehavior = "smooth") => {
    actionStreamEndRef.current?.scrollIntoView({ behavior, block: "end" })
    isNearLatestActionRef.current = true
    setShowLatestActionButton(false)
    setNewActionCount(0)
  }, [])

  useEffect(() => {
    function syncNearLatestActionState() {
      const isNearLatest = isNearLatestAction()
      isNearLatestActionRef.current = isNearLatest

      if (isNearLatest) {
        setShowLatestActionButton(false)
        setNewActionCount(0)
        return
      }

      setShowLatestActionButton(Boolean(latestVisibleActionMessageId))
    }

    syncNearLatestActionState()
    window.addEventListener("scroll", syncNearLatestActionState, { passive: true })
    window.addEventListener("resize", syncNearLatestActionState)

    return () => {
      window.removeEventListener("scroll", syncNearLatestActionState)
      window.removeEventListener("resize", syncNearLatestActionState)
    }
  }, [isNearLatestAction, latestVisibleActionMessageId])

  useEffect(() => {
    if (previousActionStreamKeyRef.current !== actionStreamKey) {
      previousActionStreamKeyRef.current = actionStreamKey
      previousLatestActionMessageIdRef.current = latestVisibleActionMessageId
      setShowLatestActionButton(false)
      setNewActionCount(0)
      return
    }

    const previousLatestActionMessageId = previousLatestActionMessageIdRef.current
    previousLatestActionMessageIdRef.current = latestVisibleActionMessageId

    if (!latestVisibleActionMessageId || previousLatestActionMessageId === latestVisibleActionMessageId) {
      return
    }

    if (!previousLatestActionMessageId || isNearLatestActionRef.current) {
      window.requestAnimationFrame(() => scrollToLatestAction("smooth"))
      return
    }

    const previousLatestIndex = visibleActionMessageIds.indexOf(previousLatestActionMessageId)
    const nextNewActionCount = previousLatestIndex >= 0
      ? visibleActionMessageIds.length - previousLatestIndex - 1
      : 1

    setNewActionCount((currentCount) => currentCount + Math.max(nextNewActionCount, 1))
    setShowLatestActionButton(true)
  }, [actionStreamKey, latestVisibleActionMessageId, scrollToLatestAction, visibleActionMessageIds])

  const actionStream = (
    <div className={styles.actionStreamShell}>
      <div className={styles.stream}>
      {visibleActionMessages.length === 0 ? (
        <p className={styles.emptyState}>
          Nenhuma acao registrada ainda.
        </p>
      ) : (
        visibleActionMessages.map((message) => (
          <CampaignActionMessageCard
            key={message.id}
            rpgId={rpgId}
            message={message}
            actionMessages={visibleActionMessages}
            isOwner={room.isOwner}
            viewerUserId={room.viewerUserId}
            isActionExpanded={Boolean(campaignActions.expandedActionIds[message.id])}
            isRollExpanded={Boolean(campaignActions.expandedRollIds[message.id])}
            formatTime={formatTime}
            onToggleAction={(messageId) =>
              campaignActions.setExpandedActionIds((currentState) => ({
                ...currentState,
                [messageId]: !currentState[messageId],
              }))
            }
            onToggleRoll={(messageId) =>
              campaignActions.setExpandedRollIds((currentState) => ({
                ...currentState,
                [messageId]: !currentState[messageId],
              }))
            }
            onRevokeAction={campaignActions.setRevokeActionMessageId}
            onAcceptDeliveryOffer={campaignActions.handleAcceptDeliveryOffer}
            onOpenDiceFromPayload={campaignActions.openDiceModalFromActionPayload}
          />
        ))
      )}
        <div ref={actionStreamEndRef} className={styles.actionStreamEndMarker} aria-hidden="true" />
      </div>
      {showLatestActionButton ? (
        <button
          type="button"
          className={styles.latestActionButton}
          onClick={() => scrollToLatestAction()}
          aria-label="Ver acao recente"
        >
          <ChevronsDown size={20} />
          {newActionCount > 0 ? (
            <span className={styles.latestActionCount}>{newActionCount > 99 ? "99+" : newActionCount}</span>
          ) : null}
        </button>
      ) : null}
    </div>
  )

  if (isChatOpen) {
    return (
      <CampaignChatPanel
        rpgId={rpgId}
        room={room}
        isBusy={isBusy}
        isCampaignEnded={isCampaignEnded}
        formatTime={formatTime}
        onClose={() => setIsChatOpen(false)}
        runAction={runAction}
        appendMessageLocally={appendMessageLocally}
      />
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.campaignToolbarShell}>
          <nav className={styles.campaignToolbar} aria-label="Acoes da campanha">
            <button
              type="button"
              className={`${styles.campaignToolbarButton} ${campaignActions.isActionMenuOpen ? styles.campaignToolbarButtonActive : ""}`}
              aria-label="Ferramentas"
              onClick={() => {
                if (isNoteOpen) {
                  setIsNoteOpen(false)
                  campaignActions.setIsActionMenuOpen(false)
                  return
                }

                setIsChatOpen(false)
                campaignActions.setIsActionMenuOpen((currentState) => !currentState)
              }}
              disabled={!isNoteOpen && isCampaignEnded}
            >
              {isNoteOpen ? <ArrowLeft size={17} /> : <Star size={17} />}
              {isNoteOpen ? "Campanha" : "Ferramenta"}
            </button>
            <button
              type="button"
              className={styles.campaignToolbarButton}
              aria-label="Chat"
              onClick={() => {
                campaignActions.setIsActionMenuOpen(false)
                setIsNoteOpen(false)
                setIsChatOpen(true)
              }}
            >
              <MessageCircle size={17} /> Chat
            </button>
            <button
              type="button"
              className={styles.campaignToolbarButton}
              aria-label="Personagem"
              onClick={() => {
                campaignActions.setIsActionMenuOpen(false)
                if (room.isOwner) {
                  void openOwnerCharacterPicker()
                  return
                }

                handleOpenCharacterSheet()
              }}
              disabled={!room.isOwner && !selectedCharacter}
            >
              <UserRound size={17} /> Personagem
            </button>
          </nav>
        </div>

        <CampaignActionControls
          actions={campaignActions}
          isBusy={isBusy}
          isCampaignEnded={isCampaignEnded}
          isOwner={room.isOwner}
          onBackToCampaign={() => router.push(`/rpg/${rpgId}/campaign`)}
          onOpenCreateCombat={
            activeCombatRoomId
              ? undefined
              : () => {
                  setCombatName("")
                  setIsCreateCombatModalOpen(true)
                }
          }
          onOpenCreatures={
            activeCombatRoomId
              ? () => {
                  setIsCreatureCombatModalOpen(true)
                }
              : undefined
          }
          onOpenNote={() => setIsNoteOpen(true)}
          showFloatingButton={false}
          selectedCharacter={selectedCharacter}
        />

        {error ? <p className={styles.feedbackError}>{error}</p> : null}
        {success ? <p className={styles.feedbackSuccess}>{success}</p> : null}
        {isCampaignEnded ? (
          <p className={styles.endedBanner}>Campanha encerrada</p>
        ) : null}

        <div className={styles.contentGrid}>
          <section className={styles.panel} hidden={isNoteOpen}>
            {activeCombatRoomId ? null : <h2 className={styles.sectionTitle}>Campanha</h2>}
            <CampaignCombatPanel
              rooms={room.combatRooms}
              activeRoomId={activeCombatRoomId}
              isOwner={room.isOwner}
              room={room}
              selectedCharacter={selectedCharacter}
              actionContent={actionStream}
              onSetActiveRoomId={setActiveCombatRoomId}
              onExitCombat={() => setActiveCombatRoomId(null)}
              onJoinRoom={joinCombatRoom}
              onCreateQueue={createCombatQueue}
              onMoveQueueEntry={moveCombatQueueEntry}
              onPassTurn={passCombatTurn}
            />
            {activeCombatRoomId ? null : actionStream}
          </section>

          <section className={`${styles.panel} ${styles.notePanel}`} hidden={!isNoteOpen}>
            <CampaignNotePanel
              campaignId={room.campaign.id}
              viewerUserId={room.viewerUserId}
              formatTime={formatTime}
            />
          </section>
        </div>

        {isCreateCombatModalOpen ? (
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onClick={() => setIsCreateCombatModalOpen(false)}
          >
            <section
              className={styles.combatCreateModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="combat-create-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.actionModalHeader}>
                <h2 id="combat-create-title" className={styles.actionModalTitle}>
                  Novo combate
                </h2>
                <button
                  type="button"
                  className={styles.closeChatButton}
                  onClick={() => setIsCreateCombatModalOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <label className={styles.combatCreateField}>
                <span>Nome do combate</span>
                <input
                  value={combatName}
                  onChange={(event) => setCombatName(event.target.value)}
                  placeholder="Pode ficar sem nome"
                />
              </label>
              <button type="button" className={styles.combatPrimaryButton} onClick={createCombatRoom}>
                Criar combate
              </button>
            </section>
          </div>
        ) : null}

        {isCreatureCombatModalOpen && activeCombatRoomId ? (
          <CampaignCreatureCombatModal
            rpgId={rpgId}
            campaignId={room.campaign.id}
            combatId={activeCombatRoomId}
            isBusy={isBusy}
            runAction={runAction}
            onClose={() => setIsCreatureCombatModalOpen(false)}
          />
        ) : null}

        {isOwnerCharacterModalOpen ? (
          <OwnerCharacterPickerModal
            characters={ownerCharacters}
            isLoading={isLoadingOwnerCharacters}
            isRevealLoading={isLoadingRevealCharacter}
            mode={ownerCharacterMode}
            participants={room.participants}
            onClose={() => setIsOwnerCharacterModalOpen(false)}
            onSelectCharacter={openCharacterDetail}
            onRevealCharacter={(characterId) => {
              void openRevealCharacterPanel(characterId)
            }}
            onSelectMode={setOwnerCharacterMode}
          />
        ) : null}

        {revealCharacter ? (
          <CharacterRevealModal
            character={revealCharacter}
            fields={revealFields}
            isBusy={isBusy}
            onClose={() => setRevealCharacter(null)}
            onSubmit={() => {
              void revealCharacterInRoom()
            }}
            onToggleField={(field) =>
              setRevealFields((currentFields) => ({
                ...currentFields,
                [field]: !currentFields[field],
              }))
            }
          />
        ) : null}

      </div>
    </main>
  )
}
