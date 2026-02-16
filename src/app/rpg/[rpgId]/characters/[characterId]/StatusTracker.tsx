"use client"

import { useEffect, useMemo, useState } from "react"
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

export default function StatusTracker({ items, rpgId, characterId, canPersist }: Props) {
  const storageKey = `rpg-character-status-current:${rpgId}:${characterId}`
  const [currentByKey, setCurrentByKey] = useState<Record<string, number>>(() =>
    items.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = item.current
      return acc
    }, {}),
  )
  const [discountInputByKey, setDiscountInputByKey] = useState<Record<string, string>>({})

  const normalizedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        current: currentByKey[item.key] ?? item.current,
      })),
    [currentByKey, items],
  )

  useEffect(() => {
    const nextDefaults = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = item.current
      return acc
    }, {})
    setCurrentByKey(nextDefaults)

    if (!canPersist) return

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return

      const merged = items.reduce<Record<string, number>>((acc, item) => {
        const candidate = (parsed as Record<string, unknown>)[item.key]
        const parsedNumber =
          typeof candidate === "number" && Number.isFinite(candidate)
            ? Math.floor(candidate)
            : item.current
        acc[item.key] = Math.max(0, Math.min(item.max, parsedNumber))
        return acc
      }, {})
      setCurrentByKey(merged)
    } catch {
      // Ignora localStorage invalido para manter uso da tela.
    }
  }, [canPersist, items, storageKey])

  useEffect(() => {
    if (!canPersist) return

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(currentByKey))
    } catch {
      // Ignora erro de escrita local para nao quebrar interacao.
    }
  }, [canPersist, currentByKey, storageKey])

  function updateStatus(key: string, delta: number) {
    const item = items.find((entry) => entry.key === key)
    if (!item) return

    const current = currentByKey[key] ?? item.current
    const next = Math.min(item.max, Math.max(0, current + delta))
    if (next === current) return

    setCurrentByKey((prev) => ({ ...prev, [key]: next }))
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
                disabled={item.current <= 0}
              >
                -
              </button>
              <button
                type="button"
                className={styles.statusButton}
                onClick={() => updateStatus(item.key, getDiscountAmount(item.key))}
                disabled={item.current >= item.max}
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
    </div>
  )
}
