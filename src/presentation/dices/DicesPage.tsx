"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import {
  calculateDiceRollStats,
  flattenDiceResults,
  formatCurrentRollFormula,
  isHighDiceResult,
  isLowDiceResult,
} from "@/application/dices/diceRollPresentation"
import {
  DICES_STORAGE_KEY,
  parseDicesStorageState,
} from "@/application/dices/diceRollStorage"
import {
  DICE_ROLL_MAX_COUNT,
  DICE_ROLL_MAX_SIDES,
  type DicesStorageState,
  type RollHistoryItem,
} from "@/application/dices/types"
import { rollDicesUseCase } from "@/application/dices/use-cases/rollDices"
import { dicesRepository } from "@/infrastructure/dices/dicesRepository"
import { DiceControls } from "@/presentation/dices/components/DiceControls"
import { DiceHistoryPanel } from "@/presentation/dices/components/DiceHistoryPanel"
import { DicesPageHeader } from "@/presentation/dices/components/DicesPageHeader"
import { RollResultStream } from "@/presentation/dices/components/RollResultStream"
import styles from "./DicesPage.module.css"

function createHistoryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `roll-${Date.now()}`
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function getSingleDiceRollResult(roll: RollHistoryItem) {
  if (roll.groups.length !== 1) return null

  const [group] = roll.groups
  if (group.diceCount !== 1 || group.results.length !== 1) return null

  return group.results[0] ?? null
}

export function DicesPage() {
  const [diceCount, setDiceCount] = useState("1")
  const [diceSides, setDiceSides] = useState("20")
  const [modifier, setModifier] = useState("0")
  const [customSides, setCustomSides] = useState<number[]>([])
  const [customDiceSidesDraft, setCustomDiceSidesDraft] = useState("")
  const [isCustomDiceOpen, setIsCustomDiceOpen] = useState(false)
  const [history, setHistory] = useState<RollHistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isRollStatsModalOpen, setIsRollStatsModalOpen] = useState(false)
  const [activeView, setActiveView] = useState<"dices" | "history">("dices")
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const latestRoll = history[0] ?? null
  const currentFormula = formatCurrentRollFormula(diceCount, diceSides, modifier)
  const latestResults = flattenDiceResults(latestRoll)
  const latestStats = calculateDiceRollStats(
    latestResults,
    isHighDiceResult,
    isLowDiceResult,
  )
  const canShowLatestStats = latestResults.length > 1 && latestStats !== null
  const recentSingleRollResults = history
    .filter((roll) => roll.id !== latestRoll?.id)
    .map(getSingleDiceRollResult)
    .filter((result): result is number => result !== null)
    .slice(0, 3)

  useEffect(() => {
    const storedState = parseDicesStorageState(localStorage.getItem(DICES_STORAGE_KEY))
    if (storedState) {
      setDiceCount(storedState.diceCount)
      setDiceSides(storedState.diceSides)
      setModifier(storedState.modifier)
      setCustomSides([...new Set(storedState.customSides)].sort((a, b) => a - b))
      setHistory(
        storedState.history.map((item) => ({
          ...item,
          diceTotal: typeof item.diceTotal === "number" ? item.diceTotal : item.total,
          modifier: typeof item.modifier === "number" ? item.modifier : 0,
          rolledAt: new Date(item.rolledAt),
        })),
      )
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const storageState: DicesStorageState = {
      diceCount,
      diceSides,
      modifier,
      customSides,
      history: history.map((item) => ({
        ...item,
        rolledAt: item.rolledAt.toISOString(),
      })),
    }
    localStorage.setItem(DICES_STORAGE_KEY, JSON.stringify(storageState))
  }, [customSides, diceCount, diceSides, history, isHydrated, modifier])

  useEffect(() => {
    return () => {
      stopHoldIncrement()
    }
  }, [])

  function stopHoldIncrement() {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }

    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }

  function startHoldIncrement(action: () => void) {
    stopHoldIncrement()
    action()

    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(action, 65)
    }, 320)
  }

  function adjustDiceCount(delta: number) {
    setDiceCount((currentValue) => {
      const currentNumber = Number(currentValue)
      const nextValue = Number.isInteger(currentNumber) ? currentNumber + delta : 1
      return String(Math.min(DICE_ROLL_MAX_COUNT, Math.max(1, nextValue)))
    })
    setError(null)
  }

  function updateDiceCountInput(value: string) {
    if (value === "") {
      setDiceCount(value)
      setError(null)
      return
    }

    const nextValue = Number(value)
    if (!Number.isInteger(nextValue)) {
      return
    }

    setDiceCount(String(Math.min(DICE_ROLL_MAX_COUNT, Math.max(1, nextValue))))
    setError(null)
  }

  function adjustModifier(delta: number) {
    setModifier((currentValue) => {
      const currentNumber = Number(currentValue)
      const nextValue = Number.isInteger(currentNumber) ? currentNumber + delta : delta
      return String(nextValue)
    })
    setError(null)
  }

  function selectDiceSides(nextDiceSides: number) {
    setDiceSides(String(nextDiceSides))
    setError(null)
  }

  function resetRollForm() {
    setDiceCount("1")
    setDiceSides("20")
    setModifier("0")
    setError(null)
  }

  function addCustomDiceSides() {
    const nextDiceSides = Number(customDiceSidesDraft)
    if (!Number.isInteger(nextDiceSides) || nextDiceSides < 2 || nextDiceSides > DICE_ROLL_MAX_SIDES) {
      setError(`Escolha um dado customizado entre 2 e ${DICE_ROLL_MAX_SIDES} lados.`)
      return
    }

    setCustomSides((currentSides) => [...new Set([...currentSides, nextDiceSides])].sort((a, b) => a - b))
    setDiceSides(String(nextDiceSides))
    setCustomDiceSidesDraft("")
    setError(null)
  }

  async function rollDices() {
    setActiveView("dices")
    setIsRolling(true)
    setError(null)

    try {
      const roll = await rollDicesUseCase(
        {
          dicesRepository,
          createHistoryId,
          now: () => new Date(),
        },
        { diceCount, diceSides, modifier },
      )

      setHistory((currentHistory) => [
        roll,
        ...currentHistory.slice(0, 19),
      ])
      setIsRollStatsModalOpen(false)
    } catch (rollError) {
      setError(rollError instanceof Error ? rollError.message : "Nao foi possivel girar os dados.")
    } finally {
      setIsRolling(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void rollDices()
  }

  function toggleHistoryCard(rollId: string) {
    setExpandedHistoryId((currentId) => (currentId === rollId ? null : rollId))
  }

  function clearPreviousRolls() {
    setHistory([])
    setCustomSides([])
    setCustomDiceSidesDraft("")
    setIsCustomDiceOpen(false)
    setExpandedHistoryId(null)
    setIsRollStatsModalOpen(false)
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="dices-title">
        <div className={styles.workspace}>
          <div className={styles.controlsColumn}>
            <DicesPageHeader activeView={activeView} onChangeView={setActiveView} />

            <div
              className={`${styles.controlsPanel} ${
                activeView === "history" ? styles.controlsPanelHiddenOnMobile : ""
              }`}
            >
              <DiceControls
                currentFormula={currentFormula}
                diceCount={diceCount}
                diceSides={diceSides}
                modifier={modifier}
                customSides={customSides}
                customDiceSidesDraft={customDiceSidesDraft}
                error={error}
                isCustomDiceOpen={isCustomDiceOpen}
                isRolling={isRolling}
                onSubmit={handleSubmit}
                onStartHold={startHoldIncrement}
                onStopHold={stopHoldIncrement}
                onAdjustDiceCount={adjustDiceCount}
                onUpdateDiceCount={updateDiceCountInput}
                onAdjustModifier={adjustModifier}
                onUpdateModifier={(value) => {
                  setModifier(value)
                  setError(null)
                }}
                onResetRoll={resetRollForm}
                onSelectDiceSides={selectDiceSides}
                onToggleCustomDice={() => setIsCustomDiceOpen((currentState) => !currentState)}
                onUpdateCustomDiceSidesDraft={setCustomDiceSidesDraft}
                onAddCustomDiceSides={addCustomDiceSides}
                onRoll={() => void rollDices()}
              />
            </div>
          </div>

          <div className={styles.streamColumn}>
            {activeView === "dices" ? (
              <RollResultStream
                latestRoll={latestRoll}
                recentSingleRollResults={recentSingleRollResults}
                canShowStats={canShowLatestStats}
                isStatsModalOpen={isRollStatsModalOpen}
                stats={latestStats}
                formatTime={formatTime}
                onOpenStats={() => setIsRollStatsModalOpen(true)}
                onCloseStats={() => setIsRollStatsModalOpen(false)}
              />
            ) : (
              <DiceHistoryPanel
                history={history}
                expandedHistoryId={expandedHistoryId}
                formatTime={formatTime}
                onClearHistory={clearPreviousRolls}
                onToggleHistoryCard={toggleHistoryCard}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
