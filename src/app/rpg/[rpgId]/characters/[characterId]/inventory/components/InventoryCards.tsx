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
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <span>{item.rarityLabel}</span>
          </div>

          {item.description ? (
            <p className={styles.cardBodyItalic}>{item.description}</p>
          ) : null}
          {item.secondaryLine ? (
            <p className={styles.cardBodyItalic}>{item.secondaryLine}</p>
          ) : null}
          {item.ability ? <p>Habilidade: {item.ability}</p> : null}
          <span>Quantidade: {item.quantity}</span>
        </div>
      ))}
    </div>
  )
}
