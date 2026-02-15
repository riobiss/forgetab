import styles from "../page.module.css"
import { InventoryCardItem } from "../types"

type Props = {
  items: InventoryCardItem[]
  emptyMessage: string
}

export default function InventoryCards({ items, emptyMessage }: Props) {
  if (items.length === 0) {
    return <p className={styles.emptyState}>{emptyMessage}</p>
  }

  return (
    <div className={styles.cardGrid}>
      {items.map((item) => (
        <div key={item.id} className={`${styles.card} ${styles[item.rarityClass]}`}>
          <div className={styles.cardTop}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <span className={styles.rarityBadge}>{item.rarityLabel}</span>
            </div>

            {item.description ? (
              <p className={styles.cardBodyItalic}>{item.description}</p>
            ) : null}
          </div>

          <div className={styles.cardInfo}>
            {item.coreStats && item.coreStats.length > 0 ? (
              <div className={styles.cardDetailsGrid}>
                {item.coreStats.map((stat, index) => (
                  <div key={`${item.id}-stat-${index}`} className={styles.detailItem}>
                    <span className={styles.detailLabelOrange}>{stat.label}</span>
                    <span className={styles.detailValue}>{stat.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {item.ability ? <p className={styles.minorInfo}>Habilidade: {item.ability}</p> : null}
            {item.metaLines?.map((line, index) => (
              <p key={`${item.id}-meta-${index}`} className={styles.minorInfo}>
                {line}
              </p>
            ))}
          </div>

          <div className={styles.cardFooter}>
            {item.secondaryLine ? (
              <span className={styles.quantity}>Tipo: {item.secondaryLine}</span>
            ) : (
              <span />
            )}
            <span className={styles.quantity}>Q.{item.quantity}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
