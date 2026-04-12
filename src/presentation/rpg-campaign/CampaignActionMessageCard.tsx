"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { ChevronDown, ChevronRight, Dice5, RotateCcw, X } from "lucide-react"
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
  humanizeSlug,
  toAbilityDisplayName,
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
  onAcceptDeliveryOffer: (
    messageId: string,
    offer: NonNullable<ReturnType<typeof parseDeliveryOfferAction>>,
    options?: { revealToRoom?: boolean },
  ) => Promise<boolean> | boolean
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
  const [isChestChoiceOpen, setIsChestChoiceOpen] = useState(false)
  const [isOpeningChest, setIsOpeningChest] = useState(false)
  const [privateChestOffer, setPrivateChestOffer] = useState<NonNullable<ReturnType<typeof parseDeliveryOfferAction>> | null>(null)
  const [publicChestOffer, setPublicChestOffer] = useState<NonNullable<ReturnType<typeof parseDeliveryOfferAction>> | null>(null)
  const [chestAnimationToken, setChestAnimationToken] = useState(0)
  const diceRoll = parseDiceRollAction(message.content)
  const skillUse = parseSkillUseAction(message.content)
  const itemUse = parseItemUseAction(message.content)
  const characterReveal = parseCharacterRevealAction(message.content)
  const deliveryOffer = parseDeliveryOfferAction(message.content)
  const isActionAuthor = message.authorId === viewerUserId
  const canOpenActionDetails = isOwner || message.authorId === viewerUserId
  const canRevokeAction =
    isOwner ||
    (message.authorId === viewerUserId && actionMessages.slice(-2).some((actionMessage) => actionMessage.id === message.id))

  if (skillUse) {
    const isStealthHidden = Boolean(skillUse.stealth) && !isOwner && !isActionAuthor
    const primaryTag = skillUse.ability.skillTags[0]
    const tagMeta = !isStealthHidden && primaryTag ? getSkillTagMeta(primaryTag) : null
    const abilityName = isStealthHidden ? "Ação furtiva" : toAbilityDisplayName(skillUse.ability)
    const actionTypeLabel = isStealthHidden
      ? "Furtivo"
      : toActionTypeLabel(skillUse.ability.skillActionType) ?? "Habilidade"
    const canOpenSkillDetails = isStealthHidden ? false : skillUse.stealth ? isOwner || isActionAuthor : canOpenActionDetails
    const isExpanded = canOpenSkillDetails && isActionExpanded

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
          canOpenActionDetails: canOpenSkillDetails,
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
    const isStealthHidden = Boolean(itemUse.stealth) && !isOwner && !isActionAuthor
    const cardItem = toInventoryCardItem(itemUse.item)
    const rarityColor = ITEM_RARITY_ACTION_COLOR[itemUse.item.itemRarity]
    const actionTypeLabel = isStealthHidden ? "Furtivo" : cardItem.secondaryLine ?? "Item"
    const canOpenItemDetails = isStealthHidden ? false : itemUse.stealth ? isOwner || isActionAuthor : canOpenActionDetails
    const isExpanded = canOpenItemDetails && isActionExpanded

    return (
      <article
        className={`${styles.streamCard} ${styles.actionStreamCard} ${isExpanded ? styles.actionStreamCardExpanded : ""}`}
        style={
          {
            "--action-summary-text": isStealthHidden ? "var(--color-text-primary)" : rarityColor.text,
          } as CSSProperties
        }
      >
        {renderActionHeader({
          actor: itemUse.characterName,
          actionTypeLabel,
          canRevokeAction,
          canOpenActionDetails: canOpenItemDetails,
          isExpanded,
          expandLabel: "item",
          messageId: message.id,
          onRevokeAction,
          onToggleAction,
        })}
        {!isExpanded ? (
          <div className={styles.actionCardSummary}>
            <div className={styles.actionSummaryTile}>
              {!isStealthHidden && cardItem.imageUrl ? (
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
                <strong className={styles.actionSummaryName}>
                  {isStealthHidden ? "Ação furtiva" : cardItem.title}
                </strong>
                {!isStealthHidden ? (
                  <small className={styles.actionSummaryMeta}>
                    {cardItem.secondaryLine ?? "Item"} - {cardItem.rarityLabel}
                  </small>
                ) : null}
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
      const isChest = deliveryOffer.mode === "chest"
      const isOpened = Boolean(deliveryOffer.openedAt)
      const isRevealed = Boolean(deliveryOffer.revealedAt)
      const canOpenChest = canInteract && !isOpened
      const canInspectRevealedChest = isOpened && isRevealed
      const canInspectHiddenChest = isOpened && !isRevealed && deliveryOffer.openedByUserId === viewerUserId
      const canInspectChest = canInspectRevealedChest || canInspectHiddenChest

      return (
        <article className={`${styles.streamCard} ${isChest ? cardStyles.chestOfferCard : cardStyles.deliveryOfferCard}`}>
          {isChest && canRevokeAction ? (
            <div className={cardStyles.chestControls}>
              <button
                type="button"
                className={`${styles.characterRevealRevokeButton} ${cardStyles.chestRevokeButton}`}
                onClick={() => onRevokeAction(message.id)}
                aria-label="Revogar entrega"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          ) : canRevokeAction ? (
            <button
              type="button"
              className={styles.characterRevealRevokeButton}
              onClick={() => onRevokeAction(message.id)}
              aria-label="Revogar entrega"
            >
              <RotateCcw size={16} />
            </button>
          ) : null}
          {isChest ? (
            <ChestOfferButton
              canOpenOffer={canOpenChest || canInspectChest}
              isOpened={isOpened}
              isRevealed={isRevealed}
              animationToken={chestAnimationToken}
              onOpen={() => {
                if (canInspectRevealedChest) {
                  setPublicChestOffer(deliveryOffer)
                  return
                }

                if (canInspectHiddenChest) {
                  setPrivateChestOffer(deliveryOffer)
                  return
                }

                if (canOpenChest) {
                  setIsChestChoiceOpen(true)
                }
              }}
            />
          ) : (
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
              <span className={cardStyles.deliveryOfferText}>
                <strong>Entrega</strong>
                <small>
                  {deliveryOffer.assets.map(formatDeliveryAssetName).join(", ")}
                </small>
              </span>
            </button>
          )}
          {!isChest && isDeliveryOfferOpen ? (
            <DeliveryOfferModal
              offer={deliveryOffer}
              canAccept={canInteract && !isOpened}
              onAccept={() => {
                onAcceptDeliveryOffer(message.id, deliveryOffer)
                setIsDeliveryOfferOpen(false)
              }}
              onClose={() => setIsDeliveryOfferOpen(false)}
            />
          ) : null}
          {isChest && isChestChoiceOpen ? (
            <ChestRevealChoiceModal
              isBusy={isOpeningChest}
              onClose={() => setIsChestChoiceOpen(false)}
              onReveal={async () => {
                setIsOpeningChest(true)
                const wasOpened = await onAcceptDeliveryOffer(message.id, deliveryOffer, { revealToRoom: true })
                setIsOpeningChest(false)
                if (wasOpened) {
                  setChestAnimationToken((currentToken) => currentToken + 1)
                  setIsChestChoiceOpen(false)
                  setPublicChestOffer(markChestOfferOpened(deliveryOffer, viewerUserId, true))
                }
              }}
              onHide={async () => {
                setIsOpeningChest(true)
                const wasOpened = await onAcceptDeliveryOffer(message.id, deliveryOffer, { revealToRoom: false })
                setIsOpeningChest(false)
                if (wasOpened) {
                  setChestAnimationToken((currentToken) => currentToken + 1)
                  setIsChestChoiceOpen(false)
                  setPrivateChestOffer(markChestOfferOpened(deliveryOffer, viewerUserId, false))
                }
              }}
            />
          ) : null}
          {privateChestOffer ? (
            <ChestLootModal
              offer={privateChestOffer}
              title="Tesouro encontrado"
              onClose={() => setPrivateChestOffer(null)}
            />
          ) : null}
          {publicChestOffer ? (
            <ChestLootModal
              offer={publicChestOffer}
              title="Tesouro revelado"
              onClose={() => setPublicChestOffer(null)}
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

  const isStealthRollHidden = Boolean(diceRoll.stealth) && !isOwner && !isActionAuthor
  const canOpenRollDetails = diceRoll.stealth ? isOwner || isActionAuthor : true

  if (isStealthRollHidden) {
    return (
      <article className={`${styles.streamCard} ${styles.actionStreamCard}`}>
        {renderActionHeader({
          actor: message.authorName || message.authorUsername,
          actionTypeLabel: "Furtivo",
          canRevokeAction,
          canOpenActionDetails: false,
          isExpanded: false,
          expandLabel: "sequencia do dado",
          messageId: message.id,
          onRevokeAction,
          onToggleAction: onToggleRoll,
        })}
        <div className={styles.actionCardSummary}>
          <div className={styles.actionSummaryTile}>
            <strong className={styles.actionSummaryName}>Ação furtiva</strong>
          </div>
        </div>
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
        canOpenActionDetails: canOpenRollDetails,
        isExpanded: canOpenRollDetails && isRollExpanded,
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
      {canOpenRollDetails && isRollExpanded ? (
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

function ChestOfferButton({
  canOpenOffer,
  isOpened,
  isRevealed,
  animationToken,
  onOpen,
}: {
  canOpenOffer: boolean
  isOpened: boolean
  isRevealed: boolean
  animationToken: number
  onOpen: () => void
}) {
  type DotLottieInstance = {
    totalFrames?: number
    play?: () => void | Promise<void>
    stop?: () => void | Promise<void>
    pause?: () => void | Promise<void>
    setFrame?: (frame: number) => void | Promise<void>
    setSpeed?: (speed: number) => void | Promise<void>
    addEventListener?: (type: "complete" | "load" | "ready", listener: () => void) => void
    removeEventListener?: (type: "complete" | "load" | "ready", listener: () => void) => void
  }

  const playerRef = useRef<HTMLElement & {
    dotLottie?: DotLottieInstance | null
  }>(null)
  const isPlayingOpeningRef = useRef(false)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadPlayer() {
      if (typeof window === "undefined") {
        return
      }

      await import("@lottiefiles/dotlottie-wc")
      await window.customElements.whenDefined("dotlottie-wc")

      if (isMounted) {
        setIsPlayerReady(true)
      }
    }

    void loadPlayer()

    return () => {
      isMounted = false
    }
  }, [])

  const getPlayer = useCallback(() => {
    if (!isPlayerReady) {
      return null
    }

    return playerRef.current?.dotLottie ?? null
  }, [isPlayerReady])

  const lockOpenFrame = useCallback(() => {
    const player = getPlayer()
    const totalFrames = Number(player?.totalFrames ?? 0)
    if (!player || totalFrames <= 1) {
      return false
    }

    void player.pause?.()
    void player.setFrame?.(totalFrames - 1)
    return true
  }, [getPlayer])

  const lockOpenFrameWithRetry = useCallback(() => {
    let attempts = 0
    let timer: number | null = null

    const tryLock = () => {
      attempts += 1
      if (lockOpenFrame() || attempts >= 30) {
        return
      }

      timer = window.setTimeout(tryLock, 100)
    }

    tryLock()

    return () => {
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [lockOpenFrame])

  const resetClosedFrame = useCallback(() => {
    const player = playerRef.current?.dotLottie
    if (!player) {
      return false
    }

    void player.setSpeed?.(0.45)
    void player.stop?.()
    void player.setFrame?.(0)
    return true
  }, [])

  const resetClosedFrameWithRetry = useCallback(() => {
    let attempts = 0
    let timer: number | null = null

    const tryReset = () => {
      attempts += 1
      if (resetClosedFrame() || attempts >= 30) {
        return
      }

      timer = window.setTimeout(tryReset, 100)
    }

    tryReset()

    return () => {
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [resetClosedFrame])

  useEffect(() => {
    if (!isPlayerReady || isOpened) {
      return
    }

    return resetClosedFrameWithRetry()
  }, [isOpened, isPlayerReady, resetClosedFrameWithRetry])

  useEffect(() => {
    if (!isPlayerReady || !isOpened || isPlayingOpeningRef.current) {
      return
    }

    return lockOpenFrameWithRetry()
  }, [isOpened, isPlayerReady, lockOpenFrameWithRetry])

  useEffect(() => {
    if (!isPlayerReady || animationToken <= 0) {
      return
    }

    isPlayingOpeningRef.current = true
    let retryTimer: number | null = null
    let fallbackTimer: number | null = null
    let animationPlayer: DotLottieInstance | null = null
    let isCancelled = false

    const handleComplete = () => {
      if (isCancelled) {
        return
      }

      isPlayingOpeningRef.current = false
      lockOpenFrameWithRetry()
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer)
      }
    }

    const startOpeningAnimation = (attempt = 1) => {
      if (isCancelled) {
        return
      }

      const player = getPlayer()
      const totalFrames = Number(player?.totalFrames ?? 0)
      if (!player || totalFrames <= 1) {
        if (attempt < 30) {
          retryTimer = window.setTimeout(() => startOpeningAnimation(attempt + 1), 100)
        } else {
          isPlayingOpeningRef.current = false
          lockOpenFrameWithRetry()
        }
        return
      }

      animationPlayer = player
      void player.setSpeed?.(0.45)
      void player.stop?.()
      void player.setFrame?.(0)
      player.addEventListener?.("complete", handleComplete)
      void player.play?.()
      fallbackTimer = window.setTimeout(handleComplete, 3600)
    }

    const frameId = window.requestAnimationFrame(() => startOpeningAnimation())

    return () => {
      isCancelled = true
      isPlayingOpeningRef.current = false
      window.cancelAnimationFrame(frameId)
      if (retryTimer) {
        window.clearTimeout(retryTimer)
      }
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer)
      }
      animationPlayer?.removeEventListener?.("complete", handleComplete)
    }
  }, [animationToken, getPlayer, isPlayerReady, lockOpenFrameWithRetry])

  const chestPlayer = (
    <span className={cardStyles.chestPlayerShell}>
      {isPlayerReady ? (
        <dotlottie-wc
          ref={playerRef}
          src="/animations/BrahmaChest.lottie"
          speed={0.45}
          className={cardStyles.chestPlayer}
        />
      ) : null}
    </span>
  )

  return (
    <div className={cardStyles.chestScene}>
      {canOpenOffer ? (
        <button
          type="button"
          className={cardStyles.chestButton}
          onClick={onOpen}
          aria-label={isOpened ? "Ver tesouro" : "Abrir bau"}
        >
          {chestPlayer}
        </button>
      ) : (
        <div className={`${cardStyles.chestButton} ${cardStyles.chestButtonStatic}`} aria-label="Bau" role="img">
          {chestPlayer}
        </div>
      )}
      {!isRevealed && isOpened ? (
        <p className={cardStyles.chestSealedHint}>O bau foi aberto em segredo.</p>
      ) : null}
    </div>
  )
}

function LootPreview({
  assets,
  isOpened,
}: {
  assets: NonNullable<ReturnType<typeof parseDeliveryOfferAction>>["assets"]
  isOpened: boolean
}) {
  return (
    <div className={isOpened ? cardStyles.lootGridRevealed : cardStyles.lootGridHidden}>
      {assets.map((asset) => {
        const assetName = formatDeliveryAssetName(asset)

        return (
          <div key={`${asset.kind}:${asset.id}`} className={cardStyles.lootItem}>
            <span className={cardStyles.lootName}>{assetName}</span>
            <small>{asset.kind === "item" ? `Item x${asset.quantity}` : `Habilidade Nv.${asset.level}`}</small>
          </div>
        )
      })}
    </div>
  )
}

function formatDeliveryAssetName(asset: NonNullable<ReturnType<typeof parseDeliveryOfferAction>>["assets"][number]) {
  return asset.kind === "skill" ? humanizeSlug(asset.name) : asset.name
}

function markChestOfferOpened(
  offer: NonNullable<ReturnType<typeof parseDeliveryOfferAction>>,
  viewerUserId: string,
  revealToRoom: boolean,
) {
  const openedAt = new Date().toISOString()

  return {
    ...offer,
    openedByUserId: viewerUserId,
    openedAt,
    revealedByUserId: revealToRoom ? viewerUserId : null,
    revealedAt: revealToRoom ? openedAt : null,
  }
}

function ChestRevealChoiceModal({
  isBusy,
  onReveal,
  onHide,
  onClose,
}: {
  isBusy: boolean
  onReveal: () => void | Promise<void>
  onHide: () => void | Promise<void>
  onClose: () => void
}) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={cardStyles.chestChoiceModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chest-choice-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="chest-choice-title" className={styles.actionModalTitle}>
            Abrir bau
          </h2>
          <button type="button" className={styles.closeChatButton} onClick={onClose} disabled={isBusy}>
            <X size={16} />
          </button>
        </div>
        <p className={cardStyles.chestChoiceText}>
          Voce pode revelar o conteudo para a sala ou guardar a descoberta so para voce.
        </p>
        <div className={cardStyles.chestChoiceActions}>
          <button type="button" className={cardStyles.chestRevealButton} onClick={onReveal} disabled={isBusy}>
            Revelar
          </button>
          <button type="button" className={cardStyles.chestHideButton} onClick={onHide} disabled={isBusy}>
            Esconder
          </button>
        </div>
      </section>
    </div>
  )
}

function ChestLootModal({
  offer,
  title,
  onClose,
}: {
  offer: NonNullable<ReturnType<typeof parseDeliveryOfferAction>>
  title: string
  onClose: () => void
}) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={cardStyles.privateLootModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="private-loot-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="private-loot-title" className={styles.actionModalTitle}>
            {title}
          </h2>
          <button type="button" className={styles.closeChatButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <LootPreview assets={offer.assets} isOpened />
      </section>
    </div>
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
          {offer.openedAt ? "Bau aberto" : offer.mode === "chest" ? "Abrir bau?" : "Aceitar entrega?"}
        </h2>
        <LootPreview assets={offer.assets} isOpened={Boolean(offer.openedAt) || offer.mode !== "chest"} />
        <div className={styles.confirmActionButtons}>
          {canAccept ? (
            <button type="button" className={cardStyles.deliveryAcceptButton} onClick={onAccept}>
              {offer.mode === "chest" ? "Abrir" : "Aceitar"}
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
