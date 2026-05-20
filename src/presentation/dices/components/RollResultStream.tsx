import { Dice5 } from "lucide-react"
import type { DiceRollStats, RollHistoryItem } from "@/application/dices/types"
import { DiceResultGrid } from "@/presentation/dices/components/DiceResultGrid"
import { RollStatsModal } from "@/presentation/dices/components/RollStatsModal"
import { RollSummary } from "@/presentation/dices/components/RollSummary"
import styles from "../DicesPage.module.css"

type RollResultStreamProps = {
  latestRoll: RollHistoryItem | null
  recentSingleRollResults: number[]
  canShowStats: boolean
  isStatsModalOpen: boolean
  stats: DiceRollStats | null
  formatTime: (date: Date) => string
  onOpenStats: () => void
  onCloseStats: () => void
}

export function RollResultStream({
  latestRoll,
  recentSingleRollResults,
  canShowStats,
  isStatsModalOpen,
  stats,
  formatTime,
  onOpenStats,
  onCloseStats,
}: RollResultStreamProps) {
  return (
    <section className={styles.resultStream} aria-label="Resultados">
      {latestRoll ? (
        <article className={styles.streamCard}>
          <div className={styles.rollHeader}>
            <span className={styles.actionTypeBadge}>
              {latestRoll.provider === "random-org" ? "random.org" : "local"}
            </span>
            {canShowStats ? (
              <button type="button" className={styles.statsButton} onClick={onOpenStats}>
                Estatisticas
              </button>
            ) : null}
            <span className={styles.streamTimeInline}>{formatTime(latestRoll.rolledAt)}</span>
          </div>

          <RollSummary roll={latestRoll} recentSingleRollResults={recentSingleRollResults} />
          <DiceResultGrid rollId={latestRoll.id} groups={latestRoll.groups} keyPrefix="latest" />

          {isStatsModalOpen && stats ? (
            <RollStatsModal stats={stats} onClose={onCloseStats} />
          ) : null}
        </article>
      ) : (
        <div className={styles.emptyState}>
          <Dice5 size={28} />
          <p>Nenhuma rolagem ainda.</p>
        </div>
      )}
    </section>
  )
}
