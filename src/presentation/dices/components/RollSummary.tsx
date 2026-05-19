import { formatRollFormula } from "@/application/dices/diceRollPresentation"
import type { RollHistoryItem } from "@/application/dices/types"
import styles from "../DicesPage.module.css"

type RollSummaryProps = {
  roll: RollHistoryItem
}

export function RollSummary({ roll }: RollSummaryProps) {
  return (
    <div className={styles.rollSummary}>
      <strong className={styles.rollFormula}>
        {formatRollFormula(roll.groups, roll.modifier)}
      </strong>
      <div className={styles.rollMetrics}>
        <div className={styles.totalPanel}>
          <span>Total</span>
          <strong>{roll.total}</strong>
        </div>
      </div>
    </div>
  )
}
