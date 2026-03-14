"use client"

import type { CharacterInventoryItemDto } from "@/application/characterInventory/types"
import styles from "../../CharactersDashboardPage.module.css"

type Props = {
  inventory: CharacterInventoryItemDto[]
  inventoryLoading: boolean
  inventoryError: string
  itemsLoading: boolean
  canManage: boolean
  onOpenPicker: () => void
  onRemoveItem: (inventoryItemId: string, quantity?: number) => void
}

export default function NpcMonsterInventoryStep({
  inventory,
  inventoryLoading,
  inventoryError,
  itemsLoading,
  canManage,
  onOpenPicker,
  onRemoveItem,
}: Props) {
  return (
    <div className={styles.modalBody}>
      <div className={styles.modalSectionHeader}>
        <h3>Items</h3>
        <button
          type="button"
          className={styles.modalPrimaryButton}
          onClick={onOpenPicker}
          disabled={!canManage || itemsLoading}
        >
          {itemsLoading ? "Carregando..." : "Adicionar item"}
        </button>
      </div>
      {inventoryLoading ? <p className={styles.modalInfo}>Carregando items...</p> : null}
      {inventoryError ? <p className={styles.modalError}>{inventoryError}</p> : null}
      {!inventoryLoading ? (
        inventory.length > 0 ? (
          <div className={styles.modalList}>
            {inventory.map((item) => (
              <div key={item.id} className={styles.modalListCard}>
                <div>
                  <strong>{item.itemName}</strong>
                  <p className={styles.modalHint}>
                    {item.quantity > 1 ? `Quantidade: ${item.quantity}` : item.itemType}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.modalSecondaryButton}
                  onClick={() => void onRemoveItem(item.id, 1)}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.modalInfo}>Nenhum item neste personagem.</p>
        )
      ) : null}
    </div>
  )
}
