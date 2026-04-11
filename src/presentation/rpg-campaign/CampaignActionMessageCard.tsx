import { useState, type CSSProperties } from "react"
import { ChevronDown, ChevronRight, Dice5, Gift, RotateCcw, X } from "lucide-react"
import Image from "next/image"
import type { RpgCampaignRoomViewModel } from "@/application/rpgCampaign/types"
import { getSkillTagMeta } from "@/lib/rpg/skillTags"
import { toInventoryCardItem } from "@/presentation/character-inventory/utils"
import {
  ITEM_RARITY_ACTION_COLOR,
  parseCharacterRevealAction,
  parseDeliveryOfferAction,
  parseDiceRollAction,
  parseItemUseAction,
  parseSkillUseAction,
  toActionTypeLabel,
} from "./actionMessages"
import { AbilityActionDetailCard, ItemActionDetailCard } from "./ActionDetailCards"
import cardStyles from "./CampaignActionMessageCard.module.css"
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
  onAcceptDeliveryOffer: (messageId: string, offer: NonNullable<ReturnType<typeof parseDeliveryOfferAction>>) => void
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
  onAcceptDeliveryOffer,
  onOpenDiceFromPayload,
}: Props) {
  const [isCharacterRevealDetailsOpen, setIsCharacterRevealDetailsOpen] = useState(false)
  const [isDeliveryOfferOpen, setIsDeliveryOfferOpen] = useState(false)
  const diceRoll = parseDiceRollAction(message.content)
  const skillUse = parseSkillUseAction(message.content)
  const itemUse = parseItemUseAction(message.content)
  const characterReveal = parseCharacterRevealAction(message.content)
  const deliveryOffer = parseDeliveryOfferAction(message.content)
  const canOpenActionDetails = isOwner || message.authorId === viewerUserId
  const canRevokeAction =
    isOwner ||
    (canOpenActionDetails && actionMessages.slice(-2).some((actionMessage) => actionMessage.id === message.id))

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
    if (deliveryOffer) {
      const isTargeted = deliveryOffer.recipientUserIds.length > 0
      const canInteract = !isOwner && (!isTargeted || deliveryOffer.recipientUserIds.includes(viewerUserId))
      const canOpenOffer = isOwner || canInteract

      return (
        <article className={`${styles.streamCard} ${cardStyles.deliveryOfferCard}`}>
          {canRevokeAction ? (
            <button
              type="button"
              className={styles.characterRevealRevokeButton}
              onClick={() => onRevokeAction(message.id)}
              aria-label="Revogar entrega"
            >
              <RotateCcw size={16} />
            </button>
          ) : null}
          <button
            type="button"
            className={cardStyles.deliveryOfferMain}
            onClick={() => {
              if (canOpenOffer) {
                setIsDeliveryOfferOpen(true)
              }
            }}
            disabled={!canOpenOffer}
          >
            <span className={cardStyles.deliveryOfferIcon}>
              <Gift size={20} />
            </span>
            <span className={cardStyles.deliveryOfferText}>
              <strong>{deliveryOffer.mode === "chest" ? "Bau" : "Entrega"}</strong>
              <small>
                {deliveryOffer.assets.map((asset) => asset.name).join(", ")}
              </small>
            </span>
          </button>
          {isDeliveryOfferOpen ? (
            <DeliveryOfferModal
              offer={deliveryOffer}
              canAccept={canInteract}
              onAccept={() => {
                setIsDeliveryOfferOpen(false)
                onAcceptDeliveryOffer(message.id, deliveryOffer)
              }}
              onClose={() => setIsDeliveryOfferOpen(false)}
            />
          ) : null}
          <span className={styles.streamTime}>{formatTime(message.createdAt)}</span>
        </article>
      )
    }

    if (characterReveal) {
      return (
        <article className={`${styles.streamCard} ${styles.characterRevealStreamCard}`}>
          {canRevokeAction ? (
            <button
              type="button"
              className={styles.characterRevealRevokeButton}
              onClick={() => onRevokeAction(message.id)}
              aria-label="Revogar apresentacao"
            >
              <RotateCcw size={16} />
            </button>
          ) : null}
          <div className={styles.characterRevealCard}>
            <button
              type="button"
              className={styles.characterRevealPortraitButton}
              onClick={() => setIsCharacterRevealDetailsOpen(true)}
              disabled={characterReveal.sections.length === 0}
              aria-label="Ver informacoes reveladas"
            >
              {characterReveal.image ? (
                <span className={styles.characterRevealPortrait}>
                  <Image
                    src={characterReveal.image}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 100vw, 38rem"
                    unoptimized
                    className={styles.characterRevealImageBackdrop}
                  />
                  <Image
                    src={characterReveal.image}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 100vw, 38rem"
                    unoptimized
                    className={styles.characterRevealImage}
                  />
                  <strong className={styles.characterRevealName}>{characterReveal.characterName}</strong>
                </span>
              ) : (
                <span className={styles.characterRevealPortraitFallback}>
                  <strong className={styles.characterRevealName}>{characterReveal.characterName}</strong>
                </span>
              )}
            </button>
          </div>
          <span className={styles.streamTime}>{formatTime(message.createdAt)}</span>
          {isCharacterRevealDetailsOpen ? (
            <CharacterRevealDetailsModal
              characterName={characterReveal.characterName}
              sections={characterReveal.sections}
              onClose={() => setIsCharacterRevealDetailsOpen(false)}
            />
          ) : null}
        </article>
      )
    }

    return (
      <article className={styles.streamCard}>
        <p className={styles.streamContent}>{message.content}</p>
        <span className={styles.streamTime}>{formatTime(message.createdAt)}</span>
      </article>
    )
  }

  return (
    <article className={`${styles.streamCard} ${styles.actionStreamCard}`}>
      {renderActionHeader({
        actor: message.authorName || message.authorUsername,
        actionTypeLabel: "Dado",
        canRevokeAction,
        canOpenActionDetails: true,
        isExpanded: isRollExpanded,
        expandLabel: "sequencia do dado",
        messageId: message.id,
        onRevokeAction,
        onToggleAction: onToggleRoll,
      })}
      <div className={styles.rollResultRow}>
        <strong className={styles.rollTotal}>Total: {diceRoll.total}</strong>
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

function DeliveryOfferModal({
  offer,
  canAccept,
  onAccept,
  onClose,
}: {
  offer: NonNullable<ReturnType<typeof parseDeliveryOfferAction>>
  canAccept: boolean
  onAccept: () => void
  onClose: () => void
}) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.confirmActionModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-offer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delivery-offer-title" className={styles.confirmActionTitle}>
          {offer.mode === "chest" ? "Abrir bau?" : "Aceitar entrega?"}
        </h2>
        <div className={cardStyles.deliveryModalAssetList}>
          {offer.assets.map((asset) => (
            <p key={`${asset.kind}:${asset.id}`}>
              {asset.name}
              {asset.kind === "item" ? ` x${asset.quantity}` : ` Nv.${asset.level}`}
            </p>
          ))}
        </div>
        <div className={styles.confirmActionButtons}>
          {canAccept ? (
            <button type="button" className={cardStyles.deliveryAcceptButton} onClick={onAccept}>
              Aceitar
            </button>
          ) : null}
          <button type="button" className={styles.confirmActionCancelButton} onClick={onClose}>
            {canAccept ? "Recusar" : "Fechar"}
          </button>
        </div>
      </section>
    </div>
  )
}

function CharacterRevealDetailsModal({
  characterName,
  sections,
  onClose,
}: {
  characterName: string
  sections: Array<{
    key: string
    title: string
    entries: Array<{ key: string; label: string; value: string | number }>
  }>
  onClose: () => void
}) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.characterRevealDetailsModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-reveal-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="character-reveal-details-title" className={styles.actionModalTitle}>
            {characterName}
          </h2>
          <button type="button" className={styles.closeChatButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.characterRevealSections}>
          {sections.map((section) => (
            <div key={section.key} className={styles.characterRevealSection}>
              <h4>{section.title}</h4>
              <dl>
                {section.entries.map((entry) => (
                  <div key={entry.key}>
                    <dt>{entry.label}</dt>
                    <dd>{entry.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
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
