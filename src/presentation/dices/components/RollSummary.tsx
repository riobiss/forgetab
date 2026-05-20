import { formatRollFormula } from "@/application/dices/diceRollPresentation"
import type { RollHistoryItem } from "@/application/dices/types"
import styles from "../DicesPage.module.css"

type RollSummaryProps = {
  roll: RollHistoryItem
  recentSingleRollResults?: number[]
}

function isSingleDiceRoll(roll: RollHistoryItem) {
  return roll.groups.length === 1 && roll.groups[0]?.diceCount === 1 && roll.groups[0]?.results.length === 1
}

export function RollSummary({ roll, recentSingleRollResults = [] }: RollSummaryProps) {
  const shouldShowRecentRolls = isSingleDiceRoll(roll) && recentSingleRollResults.length > 0

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
        {shouldShowRecentRolls ? (
          <div className={styles.recentRollsPanel} aria-label="Ultimas rolagens">
            <span>Rolagens</span>
            <div>
              {recentSingleRollResults.map((result, index) => (
                <strong
                  key={`${roll.id}-recent-roll-${index}`}
                  className={index >= 2 ? styles.recentRollHiddenOnMobile : undefined}
                >
                  {result}
                </strong>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
