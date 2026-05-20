import { ChevronDown, ChevronRight, Dice5 } from "lucide-react"
import { formatRollFormula } from "@/application/dices/diceRollPresentation"
import type { RollHistoryItem } from "@/application/dices/types"
import { DiceResultGrid } from "@/presentation/dices/components/DiceResultGrid"
import { RollSummary } from "@/presentation/dices/components/RollSummary"
import styles from "../DicesPage.module.css"

type DiceHistoryPanelProps = {
  history: RollHistoryItem[]
  expandedHistoryId: string | null
  formatTime: (date: Date) => string
  onClearHistory: () => void
  onToggleHistoryCard: (rollId: string) => void
}

function shouldShowResultGrid(roll: RollHistoryItem) {
  return roll.modifier !== 0 || roll.groups.some((group) => group.results.length > 1 || group.diceCount > 1)
}

export function DiceHistoryPanel({
  history,
  expandedHistoryId,
  formatTime,
  onClearHistory,
  onToggleHistoryCard,
}: DiceHistoryPanelProps) {
  return (
    <section className={styles.historyPanel} aria-label="Historico de rolagens">
      {history.length > 0 ? (
        <div className={styles.historyActions}>
          <button type="button" className={styles.clearHistoryButton} onClick={onClearHistory}>
            Limpar historico
          </button>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className={styles.historyList}>
          {history.map((roll) => (
            <article
              key={roll.id}
              className={`${styles.historyCard} ${expandedHistoryId === roll.id ? styles.historyCardExpanded : ""}`}
            >
              <div className={styles.historyCardTop}>
                <strong className={styles.historyFormula}>
                  {formatRollFormula(roll.groups, roll.modifier)} = {roll.total}
                </strong>
                <span>{formatTime(roll.rolledAt)}</span>
                <button
                  type="button"
                  className={styles.historyToggleButton}
                  onClick={() => onToggleHistoryCard(roll.id)}
                  aria-expanded={expandedHistoryId === roll.id}
                  aria-label={expandedHistoryId === roll.id ? "Recolher rolagem" : "Expandir rolagem"}
                >
                  {expandedHistoryId === roll.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>

              {expandedHistoryId === roll.id ? (
                <div className={styles.historyExpandedDetails}>
                  <RollSummary roll={roll} />
                  {shouldShowResultGrid(roll) ? (
                    <DiceResultGrid rollId={roll.id} groups={roll.groups} keyPrefix="history" />
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Dice5 size={28} />
          <p>Nenhuma rolagem anterior.</p>
        </div>
      )}
    </section>
  )
}
