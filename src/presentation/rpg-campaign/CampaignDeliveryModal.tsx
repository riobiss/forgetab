"use client"

import { useMemo, useState } from "react"
import { Send, X } from "lucide-react"
import Image from "next/image"
import Select, { type MultiValue } from "react-select"
import type { BaseItemDto } from "@/application/itemsDashboard/types"
import type { DashboardCharacterSummary } from "@/application/rpgDashboard/contracts/RpgDashboardGateway"
import type { SkillListItemDto } from "@/application/skillsDashboard/types"
import { humanizeSlug, type DeliveryOfferAsset } from "./actionMessages"
import modalStyles from "./CampaignDeliveryModal.module.css"
import styles from "./RpgCampaignRoomPage.module.css"

type RecipientOption = {
  value: string
  label: string
  userId: string
  characterId: string
}

type Props = {
  characters: DashboardCharacterSummary[]
  items: BaseItemDto[]
  skills: SkillListItemDto[]
  isBusy: boolean
  isLoading: boolean
  onClose: () => void
  onSubmit: (payload: {
    mode: "single" | "chest"
    assets: DeliveryOfferAsset[]
    recipients: Array<{ userId: string; characterId: string }>
  }) => void
}

export function CampaignDeliveryModal({
  characters,
  items,
  skills,
  isBusy,
  isLoading,
  onClose,
  onSubmit,
}: Props) {
  const [tab, setTab] = useState<"items" | "skills">("items")
  const [isChest, setIsChest] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<RecipientOption[]>([])

  const recipientOptions = useMemo(
    () =>
      characters
        .filter((character) => character.characterType === "player" && character.createdByUserId)
        .map((character) => ({
          value: character.id,
          label: character.name,
          userId: character.createdByUserId ?? "",
          characterId: character.id,
        })),
    [characters],
  )

  const selectedItems = items.filter((item) => selectedItemIds.includes(item.id))
  const selectedSkills = skills.filter((skill) => selectedSkillIds.includes(skill.id))
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const visibleItems = normalizedSearchTerm
    ? items.filter((item) =>
        [item.name, item.rarity, item.type]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchTerm),
      )
    : items
  const visibleSkills = normalizedSearchTerm
    ? skills.filter((skill) =>
        [skill.displayName, skill.slug]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearchTerm),
      )
    : skills
  const selectedAssets: DeliveryOfferAsset[] = [
    ...selectedItems.map((item) => ({
      kind: "item" as const,
      id: item.id,
      name: item.name,
      image: item.image,
      description: item.description,
      quantity: 1,
    })),
    ...selectedSkills.map((skill) => ({
      kind: "skill" as const,
      id: skill.id,
      name: skill.displayName ?? humanizeSlug(skill.slug),
      image: null,
      description: null,
      level: 1,
    })),
  ]

  function toggleSelected(id: string, currentIds: string[], setIds: (ids: string[]) => void) {
    if (!isChest) {
      setSelectedItemIds([])
      setSelectedSkillIds([])
      setIds([id])
      return
    }

    setIds(currentIds.includes(id) ? currentIds.filter((itemId) => itemId !== id) : [...currentIds, id])
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={modalStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <div>
            <h2 id="delivery-title" className={styles.actionModalTitle}>
              Entregar
            </h2>
            <p className={modalStyles.hint}>Escolha um alvo ou deixe livre para qualquer player pegar.</p>
          </div>
          <button type="button" className={styles.closeChatButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <label className={modalStyles.chestToggle}>
          <input
            type="checkbox"
            checked={isChest}
            onChange={(event) => {
              setIsChest(event.target.checked)
              setSelectedItemIds([])
              setSelectedSkillIds([])
            }}
          />
          <span>Bau</span>
        </label>

        <div className={modalStyles.tabs}>
          <button
            type="button"
            className={tab === "items" ? modalStyles.tabActive : modalStyles.tab}
            onClick={() => setTab("items")}
          >
            Itens
          </button>
          <button
            type="button"
            className={tab === "skills" ? modalStyles.tabActive : modalStyles.tab}
            onClick={() => setTab("skills")}
          >
            Habilidades
          </button>
        </div>

        <label className={modalStyles.field}>
          <span>Pesquisa</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={tab === "items" ? "Buscar item" : "Buscar habilidade"}
          />
        </label>

        <label className={modalStyles.field}>
          <span>Quem recebera</span>
          <Select
            isMulti
            options={recipientOptions}
            value={selectedRecipients}
            onChange={(nextValue: MultiValue<RecipientOption>) => setSelectedRecipients([...nextValue])}
            placeholder="Qualquer player pode pegar"
            classNamePrefix="campaignSelect"
          />
        </label>

        {isLoading ? (
          <p className={styles.emptyState}>Carregando opcoes...</p>
        ) : (tab === "items" && visibleItems.length === 0) || (tab === "skills" && visibleSkills.length === 0) ? (
          <p className={styles.emptyState}>Nada encontrado.</p>
        ) : (
          <div className={modalStyles.pickerList}>
            {tab === "items"
              ? visibleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${modalStyles.pickerCard} ${selectedItemIds.includes(item.id) ? modalStyles.pickerCardActive : ""}`}
                    onClick={() => toggleSelected(item.id, selectedItemIds, setSelectedItemIds)}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        width={42}
                        height={42}
                        unoptimized
                        className={modalStyles.pickerImage}
                      />
                    ) : null}
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.rarity}</small>
                    </span>
                  </button>
                ))
              : visibleSkills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className={`${modalStyles.pickerCard} ${selectedSkillIds.includes(skill.id) ? modalStyles.pickerCardActive : ""}`}
                    onClick={() => toggleSelected(skill.id, selectedSkillIds, setSelectedSkillIds)}
                  >
                    <span>
                      <strong>{skill.displayName ?? humanizeSlug(skill.slug)}</strong>
                      <small>Habilidade</small>
                    </span>
                  </button>
                ))}
          </div>
        )}

        {selectedAssets.length > 0 ? (
          <div className={modalStyles.selectionPreview}>
            {selectedAssets.map((asset) => (
              <span key={`${asset.kind}:${asset.id}`}>
                {asset.image ? (
                  <Image src={asset.image} alt="" width={28} height={28} unoptimized />
                ) : null}
                {asset.name}
              </span>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className={styles.rollSubmitButton}
          disabled={isBusy || selectedAssets.length === 0}
          onClick={() =>
            onSubmit({
              mode: isChest ? "chest" : "single",
              assets: selectedAssets,
              recipients: selectedRecipients.map((recipient) => ({
                userId: recipient.userId,
                characterId: recipient.characterId,
              })),
            })
          }
        >
          <Send size={16} /> Enviar
        </button>
      </section>
    </div>
  )
}
