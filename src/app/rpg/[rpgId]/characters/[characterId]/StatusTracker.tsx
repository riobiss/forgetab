"use client"

import { useMemo, useState } from "react"
import styles from "./page.module.css"

type StatusItem = {
  key: string
  label: string
  max: number
  current: number
}

type Props = {
  items: StatusItem[]
  rpgId: string
  characterId: string
  canPersist: boolean
}

type PersistPayload = {
  message?: string
}

export default function StatusTracker({ items, rpgId, characterId, canPersist }: Props) {
  const [currentByKey, setCurrentByKey] = useState<Record<string, number>>(() =>
    items.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = item.current
      return acc
    }, {}),
  )
  const [savingByKey, setSavingByKey] = useState<Record<string, boolean>>({})
  const [discountInputByKey, setDiscountInputByKey] = useState<Record<string, string>>({})
  const [error, setError] = useState("")

  const normalizedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        current: currentByKey[item.key] ?? item.current,
      })),
    [currentByKey, items],
  )

  async function persistCurrentStatus(key: string, value: number, rollback: number) {
    if (!canPersist) {
      return
    }

    try {
      setSavingByKey((prev) => ({ ...prev, [key]: true }))
      setError("")

      const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}/status-current`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      })
      const payload = (await response.json()) as PersistPayload

      if (!response.ok) {
        setCurrentByKey((prev) => ({ ...prev, [key]: rollback }))
        setError(payload.message ?? "Nao foi possivel salvar status atual.")
      }
    } catch {
      setCurrentByKey((prev) => ({ ...prev, [key]: rollback }))
      setError("Erro de conexao ao salvar status atual.")
    } finally {
      setSavingByKey((prev) => ({ ...prev, [key]: false }))
    }
  }

  function updateStatus(key: string, delta: number) {
    const item = items.find((entry) => entry.key === key)
    if (!item) return

    const current = currentByKey[key] ?? item.current
    const next = Math.min(item.max, Math.max(0, current + delta))
    if (next === current) return

    setCurrentByKey((prev) => ({ ...prev, [key]: next }))
    void persistCurrentStatus(key, next, current)
  }

  function getDiscountAmount(key: string) {
    const raw = (discountInputByKey[key] ?? "").trim()
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return 1
    const step = Math.floor(parsed)
    return step >= 1 ? step : 1
  }

  return (
    <div>
      <div className={styles.statusList}>
        {normalizedItems.map((item) => (
          <div key={item.key} className={styles.statusRow}>
            <span>
              {item.label}: {item.current}/{item.max}
            </span>
            <div className={styles.statusActions}>
              <button
                type="button"
                className={styles.statusButton}
                onClick={() => updateStatus(item.key, -getDiscountAmount(item.key))}
                disabled={item.current <= 0 || Boolean(savingByKey[item.key])}
              >
                -
              </button>
              <button
                type="button"
                className={styles.statusButton}
                onClick={() => updateStatus(item.key, getDiscountAmount(item.key))}
                disabled={item.current >= item.max || Boolean(savingByKey[item.key])}
              >
                +
              </button>
              <input
                type="number"
                min={1}
                step={1}
                className={styles.statusStepInput}
                value={discountInputByKey[item.key] ?? ""}
                onChange={(event) =>
                  setDiscountInputByKey((prev) => ({
                    ...prev,
                    [item.key]: event.target.value,
                  }))
                }
                placeholder="1"
              />
            </div>
          </div>
        ))}
      </div>
      {error ? <p className={styles.statusError}>{error}</p> : null}
    </div>
  )
}
