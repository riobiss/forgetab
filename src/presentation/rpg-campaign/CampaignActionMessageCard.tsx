import type { CSSProperties } from "react"
import { ChevronDown, ChevronRight, Dice5, RotateCcw } from "lucide-react"
import Image from "next/image"
import type { RpgCampaignRoomViewModel } from "@/application/rpgCampaign/types"
import { getSkillTagMeta } from "@/lib/rpg/skillTags"
import { toInventoryCardItem } from "@/presentation/character-inventory/utils"
import {
  ITEM_RARITY_ACTION_COLOR,
  parseDiceRollAction,
  parseItemUseAction,
  parseSkillUseAction,
  toActionTypeLabel,
} from "./actionMessages"
import { AbilityActionDetailCard, ItemActionDetailCard } from "./ActionDetailCards"
import styles from "./RpgCampaignRoomPage.module.css"

type CampaignActionMessage = RpgCampaignRoomViewModel["actionMessages"][number]

type Props = {
  message: CampaignActionMessage
  actionMessages: CampaignActionMessage[]
  isOwner: boolean
  viewerUserId: string
  isActionExpanded: boolean
  isRollExpanded: boolean
  formatTime: (date: Date) => string
  onToggleAction: (messageId: string) => void
  onToggleRoll: (messageId: string) => void
  onRevokeAction: (messageId: string) => void
  onOpenDiceFromPayload: (payload: unknown) => void
}

export function CampaignActionMessageCard({
  message,
  actionMessages,
  isOwner,
  viewerUserId,
  isActionExpanded,
  isRollExpanded,
  formatTime,
  onToggleAction,
  onToggleRoll,
  onRevokeAction,
  onOpenDiceFromPayload,
}: Props) {
  const diceRoll = parseDiceRollAction(message.content)
  const skillUse = parseSkillUseAction(message.content)
  const itemUse = parseItemUseAction(message.content)
  const canOpenActionDetails = isOwner || message.authorId === viewerUserId
  const canRevokeAction =
    canOpenActionDetails && actionMessages.slice(-2).some((actionMessage) => actionMessage.id === message.id)

  if (skillUse) {
    const primaryTag = skillUse.ability.skillTags[0]
    const tagMeta = primaryTag ? getSkillTagMeta(primaryTag) : null
    const abilityName = skillUse.ability.levelName ?? skillUse.ability.skillName
    const actionTypeLabel = toActionTypeLabel(skillUse.ability.skillActionType) ?? "Habilidade"
    const isExpanded = canOpenActionDetails && isActionExpanded

    return (
      <article
        className={`${styles.streamCard} ${styles.actionStreamCard} ${isExpanded ? styles.actionStreamCardExpanded : ""}`}
        style={
          tagMeta
            ? ({
                "--action-summary-text": tagMeta.text,
              } as CSSProperties)
            : undefined
        }
      >
        {renderActionHeader({
          actor: skillUse.characterName,
          actionTypeLabel,
          canRevokeAction,
          canOpenActionDetails,
          isExpanded,
          expandLabel: "habilidade",
          messageId: message.id,
          onRevokeAction,
          onToggleAction,
        })}
        {!isExpanded ? (
          <div className={styles.actionCardSummary}>
            <div className={styles.actionSummaryTile}>
              <strong className={styles.actionSummaryName}>{abilityName}</strong>
            </div>
          </div>
        ) : null}
        {isExpanded ? (
          <>
            <div className={styles.actionDetails}>
              <AbilityActionDetailCard ability={skillUse.ability} />
            </div>
            {renderActionFooter({
              time: formatTime(message.createdAt),
              onOpenDice: () => onOpenDiceFromPayload(skillUse.ability),
            })}
          </>
        ) : null}
        {!isExpanded ? (
          <span className={styles.streamTime}>{formatTime(message.createdAt)}</span>
        ) : null}
      </article>
    )
  }

  if (itemUse) {
    const cardItem = toInventoryCardItem(itemUse.item)
    const rarityColor = ITEM_RARITY_ACTION_COLOR[itemUse.item.itemRarity]
    const actionTypeLabel = cardItem.secondaryLine ?? "Item"
    const isExpanded = canOpenActionDetails && isActionExpanded

    return (
      <article
        className={`${styles.streamCard} ${styles.actionStreamCard} ${isExpanded ? styles.actionStreamCardExpanded : ""}`}
        style={
          {
            "--action-summary-text": rarityColor.text,
          } as CSSProperties
        }
      >
        {renderActionHeader({
          actor: itemUse.characterName,
          actionTypeLabel,
          canRevokeAction,
          canOpenActionDetails,
          isExpanded,
          expandLabel: "item",
          messageId: message.id,
          onRevokeAction,
          onToggleAction,
        })}
        {!isExpanded ? (
          <div className={styles.actionCardSummary}>
            <div className={styles.actionSummaryTile}>
              {cardItem.imageUrl ? (
                <Image
                  src={cardItem.imageUrl}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className={styles.actionSummaryImage}
                />
              ) : null}
              <div className={styles.actionSummaryText}>
                <strong className={styles.actionSummaryName}>{cardItem.title}</strong>
                <small className={styles.actionSummaryMeta}>
                  {cardItem.secondaryLine ?? "Item"} - {cardItem.rarityLabel}
                </small>
              </div>
            </div>
          </div>
        ) : null}
        {isExpanded ? (
          <>
            <div className={styles.actionDetails}>
              <ItemActionDetailCard item={itemUse.item} />
            </div>
            {renderActionFooter({
              time: formatTime(message.createdAt),
              onOpenDice: () => onOpenDiceFromPayload(itemUse.item),
            })}
          </>
        ) : null}
        {!isExpanded ? (
          <span className={styles.streamTime}>{formatTime(message.createdAt)}</span>
        ) : null}
      </article>
    )
  }

  if (!diceRoll) {
    return (
      <article className={styles.streamCard}>
        <p className={styles.streamContent}>{message.content}</p>
        <span className={styles.streamTime}>{formatTime(message.createdAt)}</span>
      </article>
    )
  }

  return (
    <article className={styles.streamCard}>
      <div className={styles.rollResultRow}>
        <strong className={styles.rollTotal}>Total: {diceRoll.total}</strong>
        <button
          type="button"
          className={styles.actionExpandButton}
          onClick={() => onToggleRoll(message.id)}
          aria-expanded={isRollExpanded}
          aria-label={isRollExpanded ? "Ocultar sequencia" : "Ver sequencia"}
        >
          {isRollExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      <div className={styles.rollGroupList}>
        {diceRoll.groups.map((group, index) => (
          <p key={`${message.id}-group-${index}`} className={styles.rollGroupLine}>
            {group.diceCount}d{group.diceSides}: {group.total}.
          </p>
        ))}
      </div>
      {isRollExpanded ? (
        <div className={styles.rollSequenceList}>
          {diceRoll.groups.map((group, index) => (
            <p key={`${message.id}-sequence-${index}`} className={styles.rollSequence}>
              {group.diceCount}d{group.diceSides}: {group.results.join(" + ")}
            </p>
          ))}
        </div>
      ) : null}
      <span className={styles.streamTime}>{formatTime(message.createdAt)}</span>
    </article>
  )
}

function renderActionHeader(params: {
  actor: string
  actionTypeLabel: string
  canRevokeAction: boolean
  canOpenActionDetails: boolean
  isExpanded: boolean
  expandLabel: string
  messageId: string
  onRevokeAction: (messageId: string) => void
  onToggleAction: (messageId: string) => void
}) {
  return (
    <div className={styles.actionCardTopRow}>
      <div className={styles.actionCardActor}>{params.actor}</div>
      <div className={styles.actionCardControls}>
        <span className={styles.actionTypeBadge}>{params.actionTypeLabel}</span>
        {params.canRevokeAction ? (
          <button
            type="button"
            className={styles.actionRevokeButton}
            onClick={() => params.onRevokeAction(params.messageId)}
            aria-label="Revogar acao"
          >
            <RotateCcw size={16} />
          </button>
        ) : null}
        {params.canOpenActionDetails ? (
          <button
            type="button"
            className={styles.actionExpandButton}
            onClick={() => params.onToggleAction(params.messageId)}
            aria-expanded={params.isExpanded}
            aria-label={params.isExpanded ? `Recolher ${params.expandLabel}` : `Expandir ${params.expandLabel}`}
          >
            {params.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function renderActionFooter(params: { time: string; onOpenDice: () => void }) {
  return (
    <div className={styles.actionDetailsFooter}>
      <button
        type="button"
        className={styles.actionDiceSearchButton}
        onClick={params.onOpenDice}
      >
        <Dice5 size={16} /> Buscar dados
      </button>
      <span className={styles.actionFooterTime}>{params.time}</span>
    </div>
  )
}
