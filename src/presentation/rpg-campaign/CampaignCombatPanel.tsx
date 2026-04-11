"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, Dice5, Eye, ListOrdered, Play, Shield, X } from "lucide-react"
import type {
  RpgCampaignCombatRole,
  RpgCampaignCombatRoomSummary,
  RpgCampaignRoomViewModel,
} from "@/application/rpgCampaign/types"
import type { CampaignSelectedCharacter } from "@/infrastructure/rpgCampaign/campaignPresence"
import combatStyles from "./CampaignCombatPanel.module.css"
import styles from "./RpgCampaignRoomPage.module.css"

type Props = {
  rooms: RpgCampaignCombatRoomSummary[]
  activeRoomId: string | null
  isOwner: boolean
  room: RpgCampaignRoomViewModel
  selectedCharacter: CampaignSelectedCharacter | null
  actionContent?: ReactNode
  onSetActiveRoomId: (roomId: string | null) => void
  onExitCombat: () => void
  onJoinRoom: (roomId: string, role: RpgCampaignCombatRole) => void
  onCreateQueue: (roomId: string) => void
  onMoveQueueEntry: (roomId: string, entryId: string, direction: -1 | 1) => void
  onPassTurn: (roomId: string) => void
}

export function CampaignCombatPanel({
  rooms,
  activeRoomId,
  isOwner,
  room,
  selectedCharacter,
  actionContent,
  onSetActiveRoomId,
  onExitCombat,
  onJoinRoom,
  onCreateQueue,
  onMoveQueueEntry,
  onPassTurn,
}: Props) {
  const [joinRoomId, setJoinRoomId] = useState<string | null>(null)
  const [queueRoomId, setQueueRoomId] = useState<string | null>(null)
  const activeRoom = rooms.find((combatRoom) => combatRoom.id === activeRoomId) ?? null
  const viewerParticipant = useMemo(
    () => room.participants.find((participant) => participant.userId === room.viewerUserId) ?? null,
    [room.participants, room.viewerUserId],
  )
  const viewerCombatParticipant = activeRoom?.participants.find(
    (participant) => participant.userId === room.viewerUserId,
  )
  const activeTurn = activeRoom?.queue[activeRoom.activeTurnIndex] ?? null
  const canPassTurn = Boolean(
    activeRoom &&
    activeTurn &&
    (isOwner || activeTurn.userId === room.viewerUserId),
  )

  if (rooms.length === 0) {
    return null
  }

  if (activeRoom) {
    return (
      <section className={combatStyles.section}>
        <div className={combatStyles.nestedHeader}>
          <button type="button" className={combatStyles.backButton} onClick={onExitCombat}>
            <ArrowLeft size={16} /> Campanha
          </button>
          <div>
            <p className={combatStyles.eyebrow}>Sala de batalha</p>
            <h3>{activeRoom.name}</h3>
          </div>
        </div>

        <div className={combatStyles.stickyActions}>
          <button
            type="button"
            className={combatStyles.queueButton}
            onClick={() => setQueueRoomId(activeRoom.id)}
          >
            <ListOrdered size={17} /> Fila
          </button>
          <div className={combatStyles.stickyTurn}>
            <small>Turno</small>
            <strong>{activeTurn?.label ?? "Sem turno"}</strong>
          </div>
          <button
            type="button"
            className={combatStyles.primaryButton}
            onClick={() => onPassTurn(activeRoom.id)}
            disabled={!canPassTurn}
          >
            <Play size={17} /> Passar
          </button>
        </div>

        <div className={combatStyles.nestedGrid}>
          <div className={combatStyles.arena}>
            {viewerCombatParticipant ? (
              <p className={combatStyles.roleBanner}>
                Voce entrou como {viewerCombatParticipant.role === "fighter" ? "batalhante" : "espectador"}.
              </p>
            ) : (
              <div className={combatStyles.joinInline}>
                <p className={combatStyles.roleBanner}>Entre como espectador ou batalhante para acompanhar essa sala.</p>
                <button
                  type="button"
                  className={combatStyles.enterButton}
                  onClick={() => setJoinRoomId(activeRoom.id)}
                >
                  Entrar em combate
                </button>
              </div>
            )}

            <div className={combatStyles.turnPanel}>
              {activeRoom.queue.length === 0 ? (
                <>
                  <p>A fila ainda nao foi criada.</p>
                  {isOwner ? (
                    <button
                      type="button"
                      className={combatStyles.primaryButton}
                      onClick={() => onCreateQueue(activeRoom.id)}
                      disabled={activeRoom.participants.filter((participant) => participant.role === "fighter").length === 0}
                    >
                      <Dice5 size={17} /> Girar iniciativa
                    </button>
                  ) : (
                    <small>Somente o Owner pode comecar a fila.</small>
                  )}
                </>
              ) : (
                <>
                  <small>Turno atual</small>
                  <strong>{activeTurn?.label ?? "Sem turno"}</strong>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={combatStyles.nestedActions}>
          <div className={combatStyles.nestedActionsHeader}>
            <h4>Acoes do combate</h4>
            <small>Jogadas e usos feitos enquanto essa sala estiver aberta.</small>
          </div>
          {actionContent}
        </div>

        {joinRoomId ? (
          <JoinCombatModal
            joinRoomId={joinRoomId}
            selectedCharacter={selectedCharacter}
            viewerName={viewerParticipant?.name ?? "Voce"}
            onClose={() => setJoinRoomId(null)}
            onJoinRoom={onJoinRoom}
          />
        ) : null}

        {queueRoomId ? (
          <CombatQueueModal
            combatRoom={rooms.find((combatRoom) => combatRoom.id === queueRoomId) ?? null}
            isOwner={isOwner}
            onClose={() => setQueueRoomId(null)}
            onMoveQueueEntry={onMoveQueueEntry}
          />
        ) : null}
      </section>
    )
  }

  return (
    <section className={combatStyles.section}>
      <div className={combatStyles.sectionHeader}>
        <div>
          <h3>Combates</h3>
          <p>Salas separadas para batalhas em lugares diferentes.</p>
        </div>
      </div>

      <div className={combatStyles.roomList}>
        {rooms.map((combatRoom, index) => (
          <article
            key={combatRoom.id}
            className={`${combatStyles.roomCard} ${activeRoomId === combatRoom.id ? combatStyles.roomCardActive : ""}`}
          >
            <div className={combatStyles.roomSummary}>
              <strong>{combatRoom.name || `Combate ${index + 1}`}</strong>
              <small>
                {combatRoom.participants.filter((participant) => participant.role === "fighter").length} batalhando
                {" / "}
                {combatRoom.participants.filter((participant) => participant.role === "spectator").length} assistindo
              </small>
            </div>
            <button
              type="button"
              className={combatStyles.enterButton}
              onClick={() => {
                onSetActiveRoomId(combatRoom.id)
                setJoinRoomId(combatRoom.id)
              }}
            >
              Entrar em combate
            </button>
          </article>
        ))}
      </div>

      {joinRoomId ? (
        <JoinCombatModal
          joinRoomId={joinRoomId}
          selectedCharacter={selectedCharacter}
          viewerName={viewerParticipant?.name ?? "Voce"}
          onClose={() => setJoinRoomId(null)}
          onJoinRoom={onJoinRoom}
        />
      ) : null}

      {queueRoomId ? (
        <CombatQueueModal
          combatRoom={rooms.find((combatRoom) => combatRoom.id === queueRoomId) ?? null}
          isOwner={isOwner}
          onClose={() => setQueueRoomId(null)}
          onMoveQueueEntry={onMoveQueueEntry}
        />
      ) : null}
    </section>
  )
}

function JoinCombatModal({
  joinRoomId,
  selectedCharacter,
  viewerName,
  onClose,
  onJoinRoom,
}: {
  joinRoomId: string
  selectedCharacter: CampaignSelectedCharacter | null
  viewerName: string
  onClose: () => void
  onJoinRoom: (roomId: string, role: RpgCampaignCombatRole) => void
}) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={combatStyles.choiceModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="combat-join-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={`${styles.closeChatButton} ${combatStyles.choiceModalCloseButton}`} onClick={onClose} aria-label="Fechar">
          <X size={16} />
        </button>
        <h2 id="combat-join-title">Entrar no combate</h2>
        <p>{selectedCharacter ? selectedCharacter.name : viewerName}</p>
        <div className={combatStyles.choiceGrid}>
          <button
            type="button"
            className={combatStyles.choiceButton}
            onClick={() => {
              onJoinRoom(joinRoomId, "spectator")
              onClose()
            }}
          >
            <Eye size={18} /> Assistir
          </button>
          <button
            type="button"
            className={combatStyles.choiceButton}
            onClick={() => {
              onJoinRoom(joinRoomId, "fighter")
              onClose()
            }}
          >
            <Shield size={18} /> Batalhar
          </button>
        </div>
      </section>
    </div>
  )
}

function CombatQueueModal({
  combatRoom,
  isOwner,
  onClose,
  onMoveQueueEntry,
}: {
  combatRoom: RpgCampaignCombatRoomSummary | null
  isOwner: boolean
  onClose: () => void
  onMoveQueueEntry: (roomId: string, entryId: string, direction: -1 | 1) => void
}) {
  if (!combatRoom) return null

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={combatStyles.queueModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="combat-queue-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="combat-queue-title" className={styles.actionModalTitle}>
            Fila
          </h2>
          <button type="button" className={styles.closeChatButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {combatRoom.queue.length === 0 ? (
          <p className={styles.emptyState}>A fila ainda nao foi criada.</p>
        ) : (
          <div className={combatStyles.queueList}>
            {combatRoom.queue.map((entry, index) => (
              <div key={entry.id} className={combatStyles.queueItem}>
                <span>{index + 1}</span>
                <strong>{entry.label}</strong>
                <small>d20: {entry.roll}</small>
                {isOwner ? (
                  <div className={combatStyles.queueControls}>
                    <button
                      type="button"
                      onClick={() => onMoveQueueEntry(combatRoom.id, entry.id, -1)}
                      disabled={index === 0}
                      aria-label="Subir na fila"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveQueueEntry(combatRoom.id, entry.id, 1)}
                      disabled={index === combatRoom.queue.length - 1}
                      aria-label="Descer na fila"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
