import { FileText, Send, X } from "lucide-react"
import type { DashboardCharacterSummary } from "@/features/world/application/dashboard/contracts/RpgDashboardGateway"
import type { RpgCampaignRoomViewModel } from "@forgetab/world-contracts/campaign"
import modalStyles from "./OwnerCharacterPickerModal.module.css"
import styles from "./RpgCampaignRoomPage.module.css"

export type OwnerCharacterPickerMode = "player" | "npc" | "monster"

type Props = {
  characters: DashboardCharacterSummary[]
  isLoading: boolean
  isRevealLoading: boolean
  mode: OwnerCharacterPickerMode | null
  participants: RpgCampaignRoomViewModel["participants"]
  onClose: () => void
  onSelectCharacter: (characterId: string) => void
  onRevealCharacter: (characterId: string) => void
  onSelectMode: (mode: OwnerCharacterPickerMode) => void
}

export function OwnerCharacterPickerModal({
  characters,
  isLoading,
  isRevealLoading,
  mode,
  participants,
  onClose,
  onSelectCharacter,
  onRevealCharacter,
  onSelectMode
}: Props) {
  const participantUserIds = new Set(
    participants.map((participant) => participant.userId)
  )
  const visibleCharacters = mode
    ? characters.filter((character) => {
        if (mode === "player") {
          return (
            character.characterType === "player" &&
            Boolean(
              character.createdByUserId &&
              participantUserIds.has(character.createdByUserId)
            )
          )
        }

        return character.characterType === mode
      })
    : []

  const modeTitle =
    mode === "player"
      ? "Players na partida"
      : mode === "npc"
        ? "NPCs"
        : mode === "monster"
          ? "Criaturas"
          : "Escolha o tipo"

  function getCharacterOwnerName(character: DashboardCharacterSummary) {
    if (!character.createdByUserId) {
      return null
    }

    return (
      participants.find(
        (participant) => participant.userId === character.createdByUserId
      )?.name ?? null
    )
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={modalStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-character-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="owner-character-title" className={styles.actionModalTitle}>
            Personagem
          </h2>
          <button
            type="button"
            className={styles.closeChatButton}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className={modalStyles.modes}>
          <button
            type="button"
            className={`${modalStyles.modeButton} ${mode === "player" ? modalStyles.modeButtonActive : ""}`}
            onClick={() => onSelectMode("player")}
          >
            Player
          </button>
          <button
            type="button"
            className={`${modalStyles.modeButton} ${mode === "npc" ? modalStyles.modeButtonActive : ""}`}
            onClick={() => onSelectMode("npc")}
          >
            NPC
          </button>
          <button
            type="button"
            className={`${modalStyles.modeButton} ${mode === "monster" ? modalStyles.modeButtonActive : ""}`}
            onClick={() => onSelectMode("monster")}
          >
            Criatura
          </button>
        </div>

        <div className={modalStyles.listBlock}>
          <h3>{modeTitle}</h3>
          {isLoading ? (
            <p className={styles.emptyState}>Carregando personagens...</p>
          ) : !mode ? (
            <p className={styles.emptyState}>
              Escolha uma categoria para ver as fichas disponiveis.
            </p>
          ) : visibleCharacters.length === 0 ? (
            <p className={styles.emptyState}>
              Nenhum personagem encontrado nessa categoria.
            </p>
          ) : (
            <div className={modalStyles.list}>
              {visibleCharacters.map((character) => {
                const ownerName = getCharacterOwnerName(character)

                return (
                  <article key={character.id} className={modalStyles.option}>
                    <div className={modalStyles.optionText}>
                      <strong>{character.name}</strong>
                      <small>
                        {ownerName ? `${ownerName} - ` : ""}
                        {character.classKey
                          ? `Classe: ${character.classLabel ?? character.classKey}`
                          : "Sem classe definida"}
                      </small>
                    </div>
                    <div className={modalStyles.optionActions}>
                      <button
                        type="button"
                        className={modalStyles.iconButton}
                        onClick={() => onSelectCharacter(character.id)}
                        aria-label="Abrir ficha"
                      >
                        <FileText size={16} />
                      </button>
                      {character.characterType !== "player" ? (
                        <button
                          type="button"
                          className={modalStyles.iconButton}
                          onClick={() => onRevealCharacter(character.id)}
                          disabled={isRevealLoading}
                          aria-label="Enviar para sala"
                        >
                          <Send size={16} />
                        </button>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
