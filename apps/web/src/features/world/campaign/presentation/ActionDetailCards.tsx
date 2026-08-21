import type { CSSProperties } from "react"
import Image from "next/image"
import type { CharacterInventoryItemDto } from "@forgetab/world-contracts/character-inventory"
import type { PurchasedAbilityViewDto } from "@/features/world/characters/application/abilities/types"
import { getSkillTagMeta } from "@forgetab/world-contracts/rpg/skillTags"
import abilityStyles from "@/features/world/characters/presentation/abilities/CharacterAbilitiesPage.module.css"
import type { InventoryCardItem } from "@/features/world/characters/presentation/inventory/types"
import { toInventoryCardItem } from "@/features/world/characters/presentation/inventory/utils"
import { toAbilityDisplayName, toActionTypeLabel } from "./actionMessages"
import styles from "./RpgCampaignRoomPage.module.css"

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

type AbilityCardProps = {
  ability: PurchasedAbilityViewDto
  titleAsButton?: boolean
  onTitleClick?: (ability: PurchasedAbilityViewDto) => void
}

export function AbilityActionDetailCard({
  ability,
  titleAsButton = false,
  onTitleClick
}: AbilityCardProps) {
  const primaryTag = ability.skillTags[0]
  const tagMeta = primaryTag ? getSkillTagMeta(primaryTag) : null
  const abilityName = toAbilityDisplayName(ability)
  const levelDescription = hasText(ability.levelDescription)
    ? ability.levelDescription
    : hasText(ability.summary)
      ? ability.summary
      : null
  const baseDescription = normalizeText(ability.skillDescription)
  const levelDescriptionNormalized = normalizeText(levelDescription)
  const showLevelDescription =
    levelDescriptionNormalized.length > 0 &&
    levelDescriptionNormalized !== baseDescription

  return (
    <article
      className={
        tagMeta
          ? `${abilityStyles.card} ${abilityStyles.cardTagged}`
          : abilityStyles.card
      }
      style={
        tagMeta
          ? ({
              "--tag-card-c1": tagMeta.cardC1,
              "--tag-card-c2": tagMeta.cardC2,
              "--tag-card-c3": tagMeta.cardC3,
              "--tag-card-border": tagMeta.cardBorder,
              "--tag-card-glow": tagMeta.cardGlow,
              "--tag-card-key-text": tagMeta.cardKeyText,
              "--tag-card-value-text": tagMeta.cardValueText
            } as CSSProperties)
          : undefined
      }
    >
      <div className={abilityStyles.cardHeader}>
        <h3 className={abilityStyles.cardTitle}>
          {titleAsButton ? (
            <button
              type="button"
              className={abilityStyles.skillTitleButton}
              onClick={() => onTitleClick?.(ability)}
            >
              {abilityName}
            </button>
          ) : (
            abilityName
          )}
        </h3>
        <span className={abilityStyles.levelBadge}>
          Level {ability.levelNumber}
        </span>
      </div>

      {ability.skillDescription ? (
        <p className={abilityStyles.cardBodyItalic}>
          {ability.skillDescription}
        </p>
      ) : null}
      {showLevelDescription ? (
        <p className={abilityStyles.cardBodyItalic}>{levelDescription}</p>
      ) : null}

      <div className={abilityStyles.cardDetailsGrid}>
        {hasText(ability.skillActionType) ? (
          <div className={abilityStyles.detailItem}>
            <span className={abilityStyles.detailLabelOrange}>ACAO</span>
            <span className={abilityStyles.detailValue}>
              {toActionTypeLabel(ability.skillActionType)}
            </span>
          </div>
        ) : null}
        {hasText(ability.damage) ? (
          <div className={abilityStyles.detailItem}>
            <span className={abilityStyles.detailLabelOrange}>DANO</span>
            <span className={abilityStyles.detailValue}>{ability.damage}</span>
          </div>
        ) : null}
        {hasText(ability.range) ? (
          <div className={abilityStyles.detailItem}>
            <span className={abilityStyles.detailLabelOrange}>ALCANCE</span>
            <span className={abilityStyles.detailValue}>{ability.range}</span>
          </div>
        ) : null}
        {hasText(ability.cooldown) ? (
          <div className={abilityStyles.detailItem}>
            <span className={abilityStyles.detailLabelOrange}>RECARGA</span>
            <span className={abilityStyles.detailValue}>
              {ability.cooldown}
            </span>
          </div>
        ) : null}
        {hasText(ability.duration) ? (
          <div className={abilityStyles.detailItem}>
            <span className={abilityStyles.detailLabelOrange}>DURACAO</span>
            <span className={abilityStyles.detailValue}>
              {ability.duration}
            </span>
          </div>
        ) : null}
        {hasText(ability.castTime) ? (
          <div className={abilityStyles.detailItem}>
            <span className={abilityStyles.detailLabelOrange}>CONJURACAO</span>
            <span className={abilityStyles.detailValue}>
              {ability.castTime}
            </span>
          </div>
        ) : null}
        {hasText(ability.resourceCost) ? (
          <div className={abilityStyles.detailItem}>
            <span className={abilityStyles.detailLabelOrange}>
              CUSTO RECURSO
            </span>
            <span className={abilityStyles.detailValue}>
              {ability.resourceCost}
            </span>
          </div>
        ) : null}
        {hasText(ability.costCustom) ? (
          <div className={abilityStyles.detailItem}>
            <span className={abilityStyles.detailLabelOrange}>CUSTO</span>
            <span className={abilityStyles.detailValue}>
              {ability.costCustom}
            </span>
          </div>
        ) : null}
        {ability.notesList.length > 0 ? (
          <div
            className={`${abilityStyles.detailItem} ${abilityStyles.detailFull}`}
          >
            <span className={abilityStyles.detailLabelOrange}>OBS</span>
            <span className={abilityStyles.detailValue}>
              {ability.notesList.join(" | ")}
            </span>
          </div>
        ) : null}
        {ability.customFields.map((field) => (
          <div key={field.id} className={abilityStyles.detailItem}>
            <span className={abilityStyles.detailLabelOrange}>
              {field.name}
            </span>
            <span className={abilityStyles.detailValue}>
              {field.value ?? "-"}
            </span>
          </div>
        ))}
      </div>
    </article>
  )
}

type ItemCardProps = {
  item: CharacterInventoryItemDto
  titleAsButton?: boolean
  onTitleClick?: (item: CharacterInventoryItemDto) => void
}

export function ItemActionDetailCard({
  item,
  titleAsButton = false,
  onTitleClick
}: ItemCardProps) {
  const cardItem = toInventoryCardItem(item)

  return (
    <article className={styles.itemDetailsCard}>
      <div className={styles.itemDetailsHeader}>
        {cardItem.imageUrl ? (
          <Image
            src={cardItem.imageUrl}
            alt={`Imagem de ${cardItem.title}`}
            width={72}
            height={72}
            unoptimized
            className={styles.itemDetailsImage}
          />
        ) : null}
        <div className={styles.itemDetailsTitleGroup}>
          <h3 className={styles.itemDetailsTitle}>
            {titleAsButton ? (
              <button
                type="button"
                className={styles.itemTitleButton}
                onClick={() => onTitleClick?.(item)}
              >
                {cardItem.title}
              </button>
            ) : (
              cardItem.title
            )}
          </h3>
          <span className={styles.itemDetailsMeta}>
            {cardItem.secondaryLine ?? "Item"} - {cardItem.rarityLabel} - X.
            {cardItem.quantity}
          </span>
        </div>
      </div>

      {cardItem.description ? (
        <p className={styles.itemDetailsDescription}>{cardItem.description}</p>
      ) : null}

      {cardItem.coreStats && cardItem.coreStats.length > 0 ? (
        <div className={abilityStyles.cardDetailsGrid}>
          {cardItem.coreStats.map((stat, index) => (
            <div
              key={`${cardItem.id}-stat-${index}`}
              className={abilityStyles.detailItem}
            >
              <span className={abilityStyles.detailLabelOrange}>
                {stat.label}
              </span>
              <span className={abilityStyles.detailValue}>{stat.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {renderItemHighlightList(cardItem, "abilityEntries", "HABILIDADES")}
      {renderItemHighlightList(cardItem, "effectEntries", "EFEITOS")}
    </article>
  )
}

function renderItemHighlightList(
  cardItem: InventoryCardItem,
  key: "abilityEntries" | "effectEntries",
  title: string
) {
  const entries = cardItem[key] ?? []
  if (entries.length === 0) return null

  return (
    <div className={styles.itemHighlightBlock}>
      <p className={styles.itemHighlightTitle}>{title}</p>
      <div className={styles.itemHighlightList}>
        {entries.map((entry, index) => (
          <div
            key={`${cardItem.id}-${key}-${index}`}
            className={styles.itemHighlightItem}
          >
            <p className={styles.itemHighlightName}>{entry.name}</p>
            <p className={styles.itemHighlightText}>{entry.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
