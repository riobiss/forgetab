import { getSkillTagMeta } from "@forgetab/world-contracts/rpg/skillTags"
import type { PurchasedAbilityViewDto } from "@/features/world/characters/application/abilities/types"
import {
  getAbilityCardStyle,
  getDistinctLevelDescription,
  hasText,
  toActionTypeLabel
} from "./abilityPresentation"
import styles from "./CharacterAbilitiesPage.module.css"

type Props = {
  ability: PurchasedAbilityViewDto
  onSelect: (ability: PurchasedAbilityViewDto) => void
}

export function AbilityCard({ ability, onSelect }: Props) {
  const tagged = Boolean(
    ability.skillTags[0] && getSkillTagMeta(ability.skillTags[0])
  )
  const levelDescription = getDistinctLevelDescription(ability)
  const details = [
    ["AÇÃO", toActionTypeLabel(ability.skillActionType)],
    ["DANO", ability.damage],
    ["ALCANCE", ability.range],
    ["RECARGA", ability.cooldown],
    ["DURACAO", ability.duration],
    ["CONJURACAO", ability.castTime],
    ["CUSTO RECURSO", ability.resourceCost],
    ["CUSTO", ability.costCustom]
  ].filter((entry): entry is [string, string] => hasText(entry[1]))

  return (
    <article
      className={tagged ? `${styles.card} ${styles.cardTagged}` : styles.card}
      style={getAbilityCardStyle(ability.skillTags[0])}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>
          <button
            type="button"
            className={styles.skillTitleButton}
            onClick={() => onSelect(ability)}
          >
            {ability.levelName ?? ability.skillName}
          </button>
        </h3>
        <span className={styles.levelBadge}>Level {ability.levelNumber}</span>
      </div>

      {ability.skillDescription ? (
        <p className={styles.cardBodyItalic}>{ability.skillDescription}</p>
      ) : null}
      {levelDescription ? (
        <p className={styles.cardBodyItalic}>{levelDescription}</p>
      ) : null}

      <div className={styles.cardDetailsGrid}>
        {details.map(([label, value]) => (
          <div key={label} className={styles.detailItem}>
            <span className={styles.detailLabelOrange}>{label}</span>
            <span className={styles.detailValue}>{value}</span>
          </div>
        ))}
        {ability.notesList.length > 0 ? (
          <div className={`${styles.detailItem} ${styles.detailFull}`}>
            <span className={styles.detailLabelOrange}>OBS</span>
            <span className={styles.detailValue}>
              {ability.notesList.join(" | ")}
            </span>
          </div>
        ) : null}
        {ability.customFields.map((field) => (
          <div key={field.id} className={styles.detailItem}>
            <span className={styles.detailLabelOrange}>{field.name}</span>
            <span className={styles.detailValue}>{field.value ?? "-"}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
