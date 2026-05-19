import { getDiceResultLevel } from "@/application/dices/diceRollPresentation"
import type { DiceRollGroup } from "@/application/dices/types"
import styles from "../DicesPage.module.css"

type DiceResultGridProps = {
  rollId: string
  groups: DiceRollGroup[]
  keyPrefix: string
}

const RESULT_LEVEL_CLASS = {
  extremeLow: styles.diceResultExtremeLow,
  low: styles.diceResultLow,
  neutral: "",
  high: styles.diceResultHigh,
  extremeHigh: styles.diceResultExtremeHigh,
}

export function DiceResultGrid({ rollId, groups, keyPrefix }: DiceResultGridProps) {
  return (
    <div className={styles.diceResultGrid}>
      {groups.map((group, groupIndex) => (
        group.results.map((result, resultIndex) => (
          <span
            key={`${rollId}-${keyPrefix}-dice-${groupIndex}-${resultIndex}`}
            className={`${styles.diceResultCard} ${RESULT_LEVEL_CLASS[getDiceResultLevel(result, group.diceSides)]}`}
          >
            <strong>{result}</strong>
          </span>
        ))
      ))}
    </div>
  )
}
