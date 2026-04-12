"use client"

import { useMemo, useState, type ChangeEvent, type CSSProperties } from "react"
import { ArrowLeft, Dice5, EyeOff, Gift, ImagePlus, Info, MapPin, NotebookText, PawPrint, Plus, Search, Send, Sparkles, Swords, X } from "lucide-react"
import Image from "next/image"
import type { CampaignSelectedCharacter } from "@/infrastructure/rpgCampaign/campaignPresence"
import { getSkillTagMeta } from "@/lib/rpg/skillTags"
import { toInventoryCardItem } from "@/presentation/character-inventory/utils"
import { ITEM_RARITY_ACTION_COLOR, toAbilityDisplayName, toActionTypeLabel } from "./actionMessages"
import { AbilityActionDetailCard, ItemActionDetailCard } from "./ActionDetailCards"
import controlStyles from "./CampaignActionControls.module.css"
import { CampaignDeliveryModal } from "./CampaignDeliveryModal"
import styles from "./RpgCampaignRoomPage.module.css"
import type { CampaignLocationOption, CampaignRoomActions } from "./useCampaignRoomActions"

type Props = {
  actions: CampaignRoomActions
  isBusy: boolean
  isCampaignEnded: boolean
  isOwner: boolean
  onOpenCreateCombat?: () => void
  onOpenCreatures?: () => void
  onBackToCampaign?: () => void
  onOpenNote?: () => void
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
  onBackToCampaign,
  onOpenNote,
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
          {onBackToCampaign ? (
            <button
              type="button"
              className={controlStyles.actionMenuItem}
              onClick={() => {
                actions.setIsActionMenuOpen(false)
                onBackToCampaign()
              }}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : null}
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
              <PawPrint size={16} /> Bando
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
          {isOwner ? (
            <button
              type="button"
              className={controlStyles.actionMenuItem}
              onClick={() => {
                void actions.openLocationModal()
              }}
            >
              <MapPin size={16} /> Local
            </button>
          ) : null}
          {onOpenNote ? (
            <button
              type="button"
              className={controlStyles.actionMenuItem}
              onClick={() => {
                actions.setIsActionMenuOpen(false)
                onOpenNote()
              }}
            >
              <NotebookText size={16} /> Nota
            </button>
          ) : null}
          {!isOwner && selectedCharacter ? (
            <button
              type="button"
              className={`${controlStyles.actionMenuItem} ${actions.isStealthMode ? controlStyles.actionMenuItemActive : ""}`}
              onClick={() => actions.setIsStealthMode((currentState) => !currentState)}
              aria-pressed={actions.isStealthMode}
            >
              <EyeOff size={16} /> Furtivo
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
            <Dice5 size={16} /> Girar dado
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

      {actions.isLocationModalOpen ? (
        <LocationPickerModal actions={actions} isBusy={isBusy} />
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

function LocationPickerModal({ actions, isBusy }: { actions: CampaignRoomActions; isBusy: boolean }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedOption, setSelectedOption] = useState<CampaignLocationOption | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return actions.locationOptions
    }

    return actions.locationOptions.filter((option) =>
      [option.title, option.location, option.description, option.mapTitle]
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    )
  }, [actions.locationOptions, query])

  function applyOption(option: CampaignLocationOption) {
    setSelectedOption(option)
    setTitle(option.title)
    setDescription(option.description ?? "")
    setImage(option.image ?? "")
    setIsSearchOpen(false)
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null
    event.currentTarget.value = ""
    if (!file) {
      return
    }

    const uploadedUrl = await actions.uploadLocationImage(file)
    if (uploadedUrl) {
      setImage(uploadedUrl)
      setSelectedOption(null)
    }
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={() => actions.setIsLocationModalOpen(false)}>
      <section
        className={controlStyles.locationModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-send-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="location-send-title" className={styles.actionModalTitle}>
            Local
          </h2>
          <button type="button" className={styles.closeChatButton} onClick={() => actions.setIsLocationModalOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div className={`${controlStyles.locationLayout} ${isSearchOpen ? controlStyles.locationLayoutSearchMode : ""}`}>
          <div className={controlStyles.locationSearchPanel}>
            <button
              type="button"
              className={`${controlStyles.locationSearchToggle} ${isSearchOpen ? controlStyles.locationSearchToggleActive : ""}`}
              onClick={() => setIsSearchOpen((currentState) => !currentState)}
              aria-expanded={isSearchOpen}
            >
              <Search size={16} />
              Pesquisar no mapa
            </button>

            {isSearchOpen ? (
              <>
                <label className={controlStyles.locationField}>
                  <span>Busca</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nome, mapa ou localizacao"
                  />
                </label>

                <div className={controlStyles.locationOptionList}>
                  {actions.isLoadingLocationOptions ? (
                    <p className={styles.emptyState}>Carregando locais...</p>
                  ) : filteredOptions.length === 0 ? (
                    <p className={styles.emptyState}>Nenhum local encontrado.</p>
                  ) : (
                    filteredOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`${controlStyles.locationOption} ${selectedOption?.id === option.id ? controlStyles.locationOptionActive : ""}`}
                        onClick={() => applyOption(option)}
                      >
                        {option.image ? (
                          <Image
                            src={option.image}
                            alt=""
                            width={44}
                            height={44}
                            unoptimized
                            className={controlStyles.locationOptionImage}
                          />
                        ) : (
                          <span className={controlStyles.locationOptionFallback}><MapPin size={18} /></span>
                        )}
                        <span className={controlStyles.locationOptionText}>
                          <strong>{option.title}</strong>
                          <small>
                            {option.mapTitle}{option.markerId ? " - pinado" : ""}
                          </small>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>

          {!isSearchOpen ? (
            <div className={controlStyles.locationDraftPanel}>
            <label className={controlStyles.locationImagePicker}>
              {image ? (
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 100vw, 20rem"
                  unoptimized
                  className={controlStyles.locationDraftImage}
                />
              ) : (
                <span className={controlStyles.locationImagePlaceholder}>
                  <ImagePlus size={22} />
                  Imagem do local
                </span>
              )}
              <input type="file" accept="image/*" onChange={(event) => void handleImageChange(event)} />
            </label>

            <label className={controlStyles.locationField}>
              <span>Nome</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome do local" />
            </label>

            <label className={controlStyles.locationField}>
              <span>Descricao</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Algo que a sala precisa saber"
              />
            </label>

            <button
              type="button"
              className={styles.rollSubmitButton}
              onClick={() => {
                void actions.submitLocation({
                  title,
                  description,
                  image,
                  mapId: selectedOption?.mapId ?? null,
                  mapTitle: selectedOption?.mapTitle ?? null,
                  markerId: selectedOption?.markerId ?? null,
                  location: selectedOption?.location ?? null,
                  sourceKind: selectedOption?.sourceKind ?? "image",
                })
              }}
              disabled={isBusy || actions.isUploadingLocationImage || actions.isLoadingLocationOptions}
            >
              {actions.isUploadingLocationImage ? "Enviando..." : "Enviar local"}
            </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
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
              const abilityName = toAbilityDisplayName(ability)

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

              <button
                type="button"
                className={controlStyles.removeDiceButton}
                onClick={() => {
                  actions.setDicePreviewGroups(null)
                  actions.setDiceEntries((currentEntries) =>
                    currentEntries.length > 1
                      ? currentEntries.filter((_, currentIndex) => currentIndex !== index)
                      : currentEntries,
                  )
                }}
                disabled={actions.diceEntries.length <= 1}
                aria-label="Remover dado"
              >
                <X size={16} />
              </button>
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
