"use client"

import { useState } from "react"
import styles from "../page.module.css"
import { InventoryCardItem } from "../types"

type Props = {
  items: InventoryCardItem[]
  emptyMessage: string
  onRemoveItem?: (inventoryItemId: string, quantity: number) => Promise<void> | void
  removingItemId?: string | null
}

export default function InventoryCards({
  items,
  emptyMessage,
  onRemoveItem,
  removingItemId,
}: Props) {
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null)

  if (items.length === 0) {
    return <p className={styles.emptyState}>{emptyMessage}</p>
  }

  return (
    <div className={styles.cardGrid}>
      {items.map((item) => (
        <div key={item.id} className={`${styles.card} ${styles[item.rarityClass]}`}>
          <div className={styles.cardTop}>
            {item.imageUrl ? (
              <div className={styles.cardImageFrame}>
                <img
                  src={item.imageUrl}
                  alt={`Imagem de ${item.title}`}
                  className={styles.cardImage}
                />
              </div>
            ) : null}
            <div className={styles.cardHeader}>
              <div className={styles.titleRow}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <span className={styles.inlineQuantity}>X.{item.quantity}</span>
              </div>
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
            {item.abilityEntries && item.abilityEntries.length > 0 ? (
              <div className={styles.highlightBlock}>
                <p className={styles.highlightTitle}>HABILIDADES</p>
                <div className={styles.highlightList}>
                  {item.abilityEntries.map((entry, index) => (
                    <div key={`${item.id}-ability-${index}`} className={styles.highlightItem}>
                      <p className={styles.highlightName}>{entry.name}</p>
                      <p className={styles.highlightText}>{entry.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {item.effectEntries && item.effectEntries.length > 0 ? (
              <div className={styles.highlightBlockEffect}>
                <p className={styles.highlightTitle}>EFEITOS</p>
                <div className={styles.highlightList}>
                  {item.effectEntries.map((entry, index) => (
                    <div key={`${item.id}-effect-${index}`} className={styles.highlightItem}>
                      <p className={styles.highlightName}>{entry.name}</p>
                      <p className={styles.highlightText}>{entry.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {item.metaLines?.map((line, index) => (
              <p key={`${item.id}-meta-${index}`} className={styles.minorInfo}>
                {line}
              </p>
            ))}
          </div>

          <div className={styles.cardFooter}>
            {item.secondaryLine ? (
              <span className={styles.quantity}>Tipo: {item.secondaryLine}</span>
            ) : null}
            {onRemoveItem ? (
              <div className={styles.removeRow}>
                {confirmingItemId === item.id ? (
                  <>
                    <button
                      type="button"
                      className={styles.confirmButton}
                      disabled={removingItemId === item.id || item.quantity < 1}
                      onClick={() => {
                        void onRemoveItem(item.id, 1)
                        setConfirmingItemId(null)
                      }}
                    >
                      {removingItemId === item.id ? "Retirando..." : "Confirmar"}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      disabled={removingItemId === item.id}
                      onClick={() => setConfirmingItemId(null)}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.removeButton}
                    disabled={removingItemId === item.id || item.quantity < 1}
                    onClick={() => setConfirmingItemId(item.id)}
                  >
                    Retirar
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
