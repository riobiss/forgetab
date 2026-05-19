import type { DiceRollStats } from "@/application/dices/types"
import styles from "../DicesPage.module.css"

type RollStatsModalProps = {
  stats: DiceRollStats
  onClose: () => void
}

export function RollStatsModal({ stats, onClose }: RollStatsModalProps) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.statsModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dice-stats-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 id="dice-stats-title">Estatisticas da rolagem</h2>
          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="Fechar dados da rolagem"
          >
            Fechar
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span>Maior numero</span>
            <strong>{stats.max}</strong>
          </div>
          <div className={styles.statItem}>
            <span>Menor numero</span>
            <strong>{stats.min}</strong>
          </div>
          <div className={styles.statItem}>
            <span>Altos</span>
            <strong>{stats.highCount}</strong>
          </div>
          <div className={styles.statItem}>
            <span>Baixos</span>
            <strong>{stats.lowCount}</strong>
          </div>
          <div className={styles.statItem}>
            <span>Media</span>
            <strong>{stats.average.toFixed(2)}</strong>
          </div>
        </div>
      </section>
    </div>
  )
}
