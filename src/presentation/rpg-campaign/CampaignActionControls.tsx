"use client"

import type { CSSProperties } from "react"
import { Gift, Info, PawPrint, Plus, Send, Sparkles, Swords, X } from "lucide-react"
import type { CampaignSelectedCharacter } from "@/infrastructure/rpgCampaign/campaignPresence"
import { getSkillTagMeta } from "@/lib/rpg/skillTags"
import { toInventoryCardItem } from "@/presentation/character-inventory/utils"
import { ITEM_RARITY_ACTION_COLOR, toActionTypeLabel } from "./actionMessages"
import { AbilityActionDetailCard, ItemActionDetailCard } from "./ActionDetailCards"
import controlStyles from "./CampaignActionControls.module.css"
import { CampaignDeliveryModal } from "./CampaignDeliveryModal"
import styles from "./RpgCampaignRoomPage.module.css"
import type { CampaignRoomActions } from "./useCampaignRoomActions"

type Props = {
  actions: CampaignRoomActions
  isBusy: boolean
  isCampaignEnded: boolean
  isOwner: boolean
  onOpenCreateCombat?: () => void
  onOpenCreatures?: () => void
  showFloatingButton?: boolean
  selectedCharacter: CampaignSelectedCharacter | null
}

export function CampaignActionControls({
  actions,
  isBusy,
  isCampaignEnded,
  isOwner,
  onOpenCreateCombat,
  onOpenCreatures,
  showFloatingButton = true,
  selectedCharacter,
}: Props) {
  return (
    <>
      {showFloatingButton && !isCampaignEnded ? (
        <button
          type="button"
          className={controlStyles.actionFab}
          onClick={() => actions.setIsActionMenuOpen((currentState) => !currentState)}
          aria-label="Abrir acoes da campanha"
        >
          <Sparkles size={22} />
        </button>
      ) : null}

      {actions.isActionMenuOpen ? (
        <div className={`${controlStyles.actionMenu} ${showFloatingButton ? "" : controlStyles.actionMenuToolbar}`}>
          {isOwner && onOpenCreateCombat ? (
            <button
              type="button"
              className={controlStyles.actionMenuItem}
              onClick={() => {
                actions.setIsActionMenuOpen(false)
                onOpenCreateCombat()
              }}
            >
              <Swords size={16} /> Combate
            </button>
          ) : null}
          {isOwner && onOpenCreatures ? (
            <button
              type="button"
              className={controlStyles.actionMenuItem}
              onClick={() => {
                actions.setIsActionMenuOpen(false)
                onOpenCreatures()
              }}
            >
              <PawPrint size={16} /> Criaturas
            </button>
          ) : null}
          {isOwner ? (
            <button
              type="button"
              className={controlStyles.actionMenuItem}
              onClick={() => {
                void actions.openDeliveryModal()
              }}
            >
              <Gift size={16} /> Entregar
            </button>
          ) : null}
          {!isOwner && selectedCharacter ? (
            <button
              type="button"
              className={controlStyles.actionMenuItem}
              onClick={() => {
                actions.setIsActionMenuOpen(false)
                void actions.openSkillModal()
              }}
            >
              Usar habilidade
            </button>
          ) : null}
          {!isOwner && selectedCharacter ? (
            <button
              type="button"
              className={controlStyles.actionMenuItem}
              onClick={() => {
                actions.setIsActionMenuOpen(false)
                void actions.openItemModal()
              }}
            >
              Usar item
            </button>
          ) : null}
          <button
            type="button"
            className={controlStyles.actionMenuItem}
            onClick={() => {
              actions.setIsDiceModalOpen(true)
              actions.setIsActionMenuOpen(false)
            }}
          >
            Girar dado
          </button>
        </div>
      ) : null}

      {actions.isSkillModalOpen ? (
        <SkillPickerModal actions={actions} selectedCharacter={selectedCharacter} />
      ) : null}

      {actions.isItemModalOpen ? (
        <ItemPickerModal actions={actions} selectedCharacter={selectedCharacter} />
      ) : null}

      {actions.isDeliveryModalOpen ? (
        <CampaignDeliveryModal
          characters={actions.deliveryCharacters}
          items={actions.deliveryItems}
          skills={actions.deliverySkills}
          isBusy={isBusy}
          isLoading={actions.isLoadingDeliveryOptions}
          onClose={() => actions.setIsDeliveryModalOpen(false)}
          onSubmit={(payload) => {
            void actions.submitDeliveryOffer(payload)
          }}
        />
      ) : null}

      {actions.isDiceModalOpen ? (
        <DiceRollModal actions={actions} isBusy={isBusy} isOwner={isOwner} />
      ) : null}

      {actions.selectedAbilityDetails ? (
        <AbilityDetailsModal actions={actions} isBusy={isBusy} />
      ) : null}

      {actions.selectedItemDetails ? (
        <ItemDetailsModal actions={actions} isBusy={isBusy} />
      ) : null}

      {actions.revokeActionMessageId ? (
        <RevokeActionModal actions={actions} isBusy={isBusy} />
      ) : null}
    </>
  )
}

function SkillPickerModal({
  actions,
  selectedCharacter,
}: {
  actions: CampaignRoomActions
  selectedCharacter: CampaignSelectedCharacter | null
}) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={() => actions.setIsSkillModalOpen(false)}>
      <section
        className={controlStyles.actionModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-use-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="skill-use-title" className={styles.actionModalTitle}>
            Usar habilidade
          </h2>
          <button type="button" className={styles.closeChatButton} onClick={() => actions.setIsSkillModalOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {actions.isLoadingCharacterAbilities ? (
          <p className={styles.emptyState}>Carregando habilidades...</p>
        ) : actions.characterAbilities.length === 0 ? (
          <p className={styles.emptyState}>Esse personagem ainda nao tem habilidades para usar.</p>
        ) : (
          <div className={controlStyles.skillPickerList}>
            {actions.characterAbilities.map((ability) => {
              const primaryTag = ability.skillTags[0]
              const tagMeta = primaryTag ? getSkillTagMeta(primaryTag) : null
              const abilityName = ability.levelName ?? ability.skillName

              return (
                <article
                  key={`${ability.skillId}:${ability.levelNumber}`}
                  className={`${controlStyles.skillPickerCard} ${controlStyles.skillPickerAbilityCard}`}
                  style={
                    tagMeta
                      ? ({
                          "--skill-picker-card-bg": tagMeta.bg,
                          "--skill-picker-card-border": tagMeta.border,
                          "--skill-picker-card-text": tagMeta.text,
                        } as CSSProperties)
                      : undefined
                  }
                >
                  <div className={controlStyles.skillPickerAbilityMain}>
                    <strong className={controlStyles.skillPickerAbilityName}>{abilityName}</strong>
                    <small className={controlStyles.skillPickerAbilityMeta}>
                      {toActionTypeLabel(ability.skillActionType) ?? "Habilidade"}
                    </small>
                  </div>
                  <div className={controlStyles.skillPickerActions}>
                    <button
                      type="button"
                      className={controlStyles.skillPickerActionButton}
                      onClick={() => {
                        void actions.openLatestAbilityDetails({
                          ability,
                          mode: "view",
                          characterId: selectedCharacter?.id ?? null,
                        })
                      }}
                      aria-label="Ver habilidade inteira"
                    >
                      <Info size={16} />
                    </button>
                    <button
                      type="button"
                      className={`${controlStyles.skillPickerActionButton} ${controlStyles.skillPickerSendButton}`}
                      onClick={() => {
                        void actions.handleUseAbility(ability)
                      }}
                      aria-label="Enviar habilidade"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function ItemPickerModal({
  actions,
  selectedCharacter,
}: {
  actions: CampaignRoomActions
  selectedCharacter: CampaignSelectedCharacter | null
}) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={() => actions.setIsItemModalOpen(false)}>
      <section
        className={controlStyles.actionModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-use-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="item-use-title" className={styles.actionModalTitle}>
            Usar item
          </h2>
          <button type="button" className={styles.closeChatButton} onClick={() => actions.setIsItemModalOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {actions.isLoadingCharacterItems ? (
          <p className={styles.emptyState}>Carregando itens...</p>
        ) : actions.characterItems.length === 0 ? (
          <p className={styles.emptyState}>Esse personagem ainda nao tem itens para usar.</p>
        ) : (
          <div className={controlStyles.skillPickerList}>
            {actions.characterItems.map((item) => {
              const cardItem = toInventoryCardItem(item)
              const rarityColor = ITEM_RARITY_ACTION_COLOR[item.itemRarity]

              return (
                <article
                  key={item.id}
                  className={`${controlStyles.skillPickerCard} ${controlStyles.skillPickerAbilityCard}`}
                  style={
                    {
                      "--skill-picker-card-bg": rarityColor.bg,
                      "--skill-picker-card-border": rarityColor.border,
                      "--skill-picker-card-text": rarityColor.text,
                    } as CSSProperties
                  }
                >
                  <div className={controlStyles.skillPickerAbilityMain}>
                    <strong className={controlStyles.skillPickerAbilityName}>{cardItem.title}</strong>
                    <small className={controlStyles.skillPickerAbilityMeta}>
                      {cardItem.secondaryLine ?? "Item"} - {cardItem.rarityLabel} - X.{cardItem.quantity}
                    </small>
                  </div>
                  <div className={controlStyles.skillPickerActions}>
                    <button
                      type="button"
                      className={controlStyles.skillPickerActionButton}
                      onClick={() => {
                        void actions.openLatestItemDetails({
                          item,
                          mode: "view",
                          characterId: selectedCharacter?.id ?? null,
                        })
                      }}
                      aria-label="Ver item inteiro"
                    >
                      <Info size={16} />
                    </button>
                    <button
                      type="button"
                      className={`${controlStyles.skillPickerActionButton} ${controlStyles.skillPickerSendButton}`}
                      onClick={() => {
                        void actions.handleUseItem(item)
                      }}
                      aria-label="Enviar item"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function DiceRollModal({
  actions,
  isBusy,
  isOwner,
}: {
  actions: CampaignRoomActions
  isBusy: boolean
  isOwner: boolean
}) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={actions.closeDiceModal}>
      <section
        className={controlStyles.actionModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dice-roll-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="dice-roll-title" className={styles.actionModalTitle}>
            Girar dado
          </h2>
          <div className={controlStyles.actionModalControls}>
            <button
              type="button"
              className={controlStyles.addDiceButton}
              onClick={() => {
                actions.setDicePreviewGroups(null)
                actions.setDiceEntries((currentEntries) => [
                  ...currentEntries,
                  { diceCount: "1", diceSides: "20" },
                ])
              }}
            >
              <Plus size={16} />
            </button>
            <button type="button" className={styles.closeChatButton} onClick={actions.closeDiceModal}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className={controlStyles.diceFields}>
          {actions.diceEntries.map((entry, index) => (
            <div key={`dice-entry-${index}`} className={controlStyles.diceEntryRow}>
              <label className={controlStyles.diceField}>
                <span>Numero de dados</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={entry.diceCount}
                  onChange={(event) => {
                    actions.setDicePreviewGroups(null)
                    actions.setDiceEntries((currentEntries) =>
                      currentEntries.map((currentEntry, currentIndex) =>
                        currentIndex === index
                          ? { ...currentEntry, diceCount: event.target.value }
                          : currentEntry,
                      ),
                    )
                  }}
                />
              </label>

              <label className={controlStyles.diceField}>
                <span>Lados do dado</span>
                <input
                  type="number"
                  min={2}
                  max={1000}
                  value={entry.diceSides}
                  onChange={(event) => {
                    actions.setDicePreviewGroups(null)
                    actions.setDiceEntries((currentEntries) =>
                      currentEntries.map((currentEntry, currentIndex) =>
                        currentIndex === index
                          ? { ...currentEntry, diceSides: event.target.value }
                          : currentEntry,
                      ),
                    )
                  }}
                />
              </label>
            </div>
          ))}
        </div>

        {isOwner && actions.dicePreviewGroups ? (
          <div className={controlStyles.dicePreview}>
            <div className={controlStyles.dicePreviewHeader}>
              <strong>Resultado antes de mostrar</strong>
              <small>Voce pode ajustar os valores abaixo.</small>
            </div>

            <div className={controlStyles.dicePreviewGroups}>
              {actions.dicePreviewGroups.map((group, groupIndex) => (
                <div key={`preview-group-${groupIndex}`} className={controlStyles.dicePreviewGroup}>
                  <p className={controlStyles.dicePreviewLabel}>
                    {group.diceCount}d{group.diceSides}
                  </p>
                  <div className={controlStyles.dicePreviewResults}>
                    {group.results.map((result, resultIndex) => (
                      <input
                        key={`preview-result-${groupIndex}-${resultIndex}`}
                        type="number"
                        min={1}
                        max={group.diceSides}
                        value={result}
                        onChange={(event) =>
                          actions.setDicePreviewGroups((currentGroups) =>
                            currentGroups?.map((currentGroup, currentGroupIndex) =>
                              currentGroupIndex === groupIndex
                                ? {
                                    ...currentGroup,
                                    results: currentGroup.results.map((currentResult, currentResultIndex) =>
                                      currentResultIndex === resultIndex
                                        ? event.target.value
                                        : currentResult,
                                    ),
                                  }
                                : currentGroup,
                            ) ?? null,
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className={styles.rollSubmitButton}
          onClick={() => {
            if (isOwner && actions.dicePreviewGroups) {
              void actions.submitDiceRoll(actions.dicePreviewGroups)
              return
            }

            void actions.handleDiceRoll()
          }}
          disabled={isBusy}
        >
          {isOwner && actions.dicePreviewGroups ? "Mostrar resultado" : "Girar"}
        </button>
      </section>
    </div>
  )
}

function AbilityDetailsModal({ actions, isBusy }: { actions: CampaignRoomActions; isBusy: boolean }) {
  const selectedAbility = actions.selectedAbilityDetails
  if (!selectedAbility) return null

  function closeDetails() {
    actions.setSelectedAbilityDetails(null)
    actions.setSelectedAbilityDetailsMode("view")
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={closeDetails}>
      <section
        className={controlStyles.skillDetailsModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={controlStyles.skillDetailsTopBar}>
          <button type="button" className={styles.closeChatButton} onClick={closeDetails}>
            <X size={16} />
          </button>
        </div>

        <AbilityActionDetailCard ability={selectedAbility} />

        {actions.selectedAbilityDetailsMode === "use" ? (
          <div className={controlStyles.skillDetailsActions}>
            <button
              type="button"
              className={styles.rollSubmitButton}
              onClick={() => {
                void actions.handleUseAbility(selectedAbility)
              }}
              disabled={isBusy}
            >
              Usar habilidade
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function ItemDetailsModal({ actions, isBusy }: { actions: CampaignRoomActions; isBusy: boolean }) {
  const selectedItem = actions.selectedItemDetails
  if (!selectedItem) return null

  function closeDetails() {
    actions.setSelectedItemDetails(null)
    actions.setSelectedItemDetailsMode("view")
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={closeDetails}>
      <section
        className={controlStyles.skillDetailsModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={controlStyles.skillDetailsTopBar}>
          <button type="button" className={styles.closeChatButton} onClick={closeDetails}>
            <X size={16} />
          </button>
        </div>

        <ItemActionDetailCard item={selectedItem} />

        {actions.selectedItemDetailsMode === "use" ? (
          <div className={controlStyles.skillDetailsActions}>
            <button
              type="button"
              className={styles.rollSubmitButton}
              onClick={() => {
                void actions.handleUseItem(selectedItem)
              }}
              disabled={isBusy}
            >
              Usar item
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function RevokeActionModal({ actions, isBusy }: { actions: CampaignRoomActions; isBusy: boolean }) {
  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onClick={() => actions.setRevokeActionMessageId(null)}
    >
      <section
        className={styles.confirmActionModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="revoke-action-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="revoke-action-title" className={styles.confirmActionTitle}>
          Deseja desfazer a jogada?
        </h2>
        <div className={styles.confirmActionButtons}>
          <button
            type="button"
            className={styles.confirmActionDangerButton}
            onClick={() => {
              void actions.handleRevokeActionMessage()
            }}
            disabled={isBusy}
          >
            Sim
          </button>
          <button
            type="button"
            className={styles.confirmActionCancelButton}
            onClick={() => actions.setRevokeActionMessageId(null)}
            disabled={isBusy}
          >
            Nao
          </button>
        </div>
      </section>
    </div>
  )
}
