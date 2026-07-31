"use client"

import { useEffect, useMemo, useState } from "react"
import type { CharacterStatusCurrentDependencies } from "@/features/world/characters/application/status-current/contracts/CharacterStatusCurrentGateway"
import { updateCharacterStatusCurrentClientUseCase } from "@/features/world/characters/application/status-current/use-cases/updateCharacterStatusCurrentClient"
import { createCharacterStatusCurrentDependencies } from "./dependencies"
import styles from "./CharacterDetailPage.module.css"

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
  dependencies?: CharacterStatusCurrentDependencies
}

const defaultDependencies = createCharacterStatusCurrentDependencies()

export default function StatusTracker({
  items,
  rpgId,
  characterId,
  canPersist,
  dependencies = defaultDependencies,
}: Props) {
  const defaults = useMemo(
    () =>
      items.reduce<Record<string, number>>((acc, item) => {
        acc[item.key] = item.current
        return acc
      }, {}),
    [items],
  )
  const [currentByKey, setCurrentByKey] = useState<Record<string, number>>(defaults)
  const [discountInputByKey, setDiscountInputByKey] = useState<Record<string, string>>({})
  const [savingStatusKey, setSavingStatusKey] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    setCurrentByKey(defaults)
  }, [defaults])

  const normalizedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        current: currentByKey[item.key] ?? item.current,
      })),
    [currentByKey, items],
  )

  async function updateStatus(key: string, delta: number) {
    if (!canPersist || savingStatusKey) return

    const item = items.find((entry) => entry.key === key)
    if (!item) return

    const current = currentByKey[key] ?? item.current
    const next = Math.min(item.max, Math.max(0, current + delta))
    if (next === current) return

    setError("")
    setSavingStatusKey(key)
    setCurrentByKey((prev) => ({ ...prev, [key]: next }))

    try {
      const result = await updateCharacterStatusCurrentClientUseCase(dependencies, {
        rpgId,
        characterId,
        key,
        value: next,
      })
      setCurrentByKey((prev) => ({ ...prev, [key]: result.value }))
    } catch (cause) {
      setCurrentByKey((prev) => ({ ...prev, [key]: current }))
      setError(cause instanceof Error ? cause.message : "Erro ao salvar status atual.")
    } finally {
      setSavingStatusKey(null)
    }
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
                onClick={() => void updateStatus(item.key, -getDiscountAmount(item.key))}
                disabled={!canPersist || savingStatusKey !== null || item.current <= 0}
              >
                -
              </button>
              <button
                type="button"
                className={styles.statusButton}
                onClick={() => void updateStatus(item.key, getDiscountAmount(item.key))}
                disabled={!canPersist || savingStatusKey !== null || item.current >= item.max}
              >
                +
              </button>
              <input
                type="number"
                onWheel={(event) => event.currentTarget.blur()}
                min={1}
                step={1}
                disabled={!canPersist || savingStatusKey !== null}
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
      {savingStatusKey ? (
        <p className={styles.statusHint} role="status">
          Salvando status...
        </p>
      ) : null}
      {error ? (
        <p className={styles.statusError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
