"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { ChevronDown, ChevronRight, Dice5 } from "lucide-react"
import { httpDicesRepository, type DiceRollGroup } from "@/infrastructure/dices/httpDicesRepository"
import styles from "./DicesPage.module.css"

const STORAGE_KEY = "forgetab:dices"
const MAX_DICE_COUNT = 100
const MAX_DICE_SIDES = 1000
const PRESET_DICE_SIDES = [2, 4, 6, 8, 10, 12, 20, 100]

type RollHistoryItem = {
  id: string
  provider: "local" | "random-org"
  groups: DiceRollGroup[]
  diceTotal: number
  modifier: number
  total: number
  rolledAt: Date
}

type StoredRollHistoryItem = Omit<RollHistoryItem, "rolledAt"> & {
  rolledAt: string
}

type DicesStorageState = {
  diceCount: string
  diceSides: string
  modifier: string
  customSides: number[]
  history: StoredRollHistoryItem[]
}

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

function parseStorageState(value: string | null): DicesStorageState | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<DicesStorageState>
    if (typeof parsed.diceCount !== "string" || typeof parsed.diceSides !== "string") {
      return null
    }

    return {
      diceCount: parsed.diceCount,
      diceSides: parsed.diceSides,
      modifier: typeof parsed.modifier === "string" ? parsed.modifier : "0",
      customSides: Array.isArray(parsed.customSides)
        ? parsed.customSides.filter((value) => Number.isInteger(value) && value >= 2 && value <= MAX_DICE_SIDES)
        : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  } catch {
    return null
  }
}

function getDiceResultTone(value: number, diceSides: number) {
  const range = Math.max(diceSides - 1, 1)
  const lowDistance = (value - 1) / range
  const highDistance = (diceSides - value) / range

  if (value <= 1) return styles.diceResultExtremeLow
  if (value >= diceSides) return styles.diceResultExtremeHigh
  if (highDistance <= 0.2) return styles.diceResultHigh
  if (lowDistance <= 0.2) return styles.diceResultLow
  return ""
}

function isHighDiceResult(value: number, diceSides: number) {
  const tone = getDiceResultTone(value, diceSides)
  return tone === styles.diceResultHigh || tone === styles.diceResultExtremeHigh
}

function isLowDiceResult(value: number, diceSides: number) {
  const tone = getDiceResultTone(value, diceSides)
  return tone === styles.diceResultLow || tone === styles.diceResultExtremeLow
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
  const historyRolls = history
  const currentFormula = `${Number(diceCount) || 0}d${Number(diceSides) || 0}${Number(modifier) ? `${Number(modifier) > 0 ? "+" : ""}${Number(modifier)}` : ""}`
  const latestResults = latestRoll?.groups.flatMap((group) =>
    group.results.map((value) => ({ value, diceSides: group.diceSides })),
  ) ?? []
  const canShowLatestStats = latestResults.length > 1
  const latestStats = latestResults.length > 0
    ? {
        max: Math.max(...latestResults.map((result) => result.value)),
        min: Math.min(...latestResults.map((result) => result.value)),
        highCount: latestResults.filter((result) => isHighDiceResult(result.value, result.diceSides)).length,
        lowCount: latestResults.filter((result) => isLowDiceResult(result.value, result.diceSides)).length,
        average: latestResults.reduce((sum, result) => sum + result.value, 0) / latestResults.length,
      }
    : null

  useEffect(() => {
    const storedState = parseStorageState(localStorage.getItem(STORAGE_KEY))
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageState))
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
      return String(Math.min(MAX_DICE_COUNT, Math.max(1, nextValue)))
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

    setDiceCount(String(Math.min(MAX_DICE_COUNT, Math.max(1, nextValue))))
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

  function validateEntry() {
    const nextDiceCount = Number(diceCount)
    const nextDiceSides = Number(diceSides)
    const nextModifier = Number(modifier)

    if (!Number.isInteger(nextDiceCount) || nextDiceCount < 1 || nextDiceCount > MAX_DICE_COUNT) {
      throw new Error(`Escolha entre 1 e ${MAX_DICE_COUNT} dados.`)
    }

    if (!Number.isInteger(nextDiceSides) || nextDiceSides < 2 || nextDiceSides > MAX_DICE_SIDES) {
      throw new Error(`Escolha um dado entre 2 e ${MAX_DICE_SIDES} lados.`)
    }

    if (!Number.isInteger(nextModifier)) {
      throw new Error("Informe um modificador inteiro.")
    }

    return {
      diceCount: nextDiceCount,
      diceSides: nextDiceSides,
      modifier: nextModifier,
    }
  }

  function selectDiceSides(nextDiceSides: number) {
    setDiceSides(String(nextDiceSides))
    setError(null)
  }

  function addCustomDiceSides() {
    const nextDiceSides = Number(customDiceSidesDraft)
    if (!Number.isInteger(nextDiceSides) || nextDiceSides < 2 || nextDiceSides > MAX_DICE_SIDES) {
      setError(`Escolha um dado customizado entre 2 e ${MAX_DICE_SIDES} lados.`)
      return
    }

    setCustomSides((currentSides) => [...new Set([...currentSides, nextDiceSides])].sort((a, b) => a - b))
    setDiceSides(String(nextDiceSides))
    setCustomDiceSidesDraft("")
    setError(null)
  }

  async function rollDices() {
    setIsRolling(true)
    setError(null)

    try {
      const entry = validateEntry()
      const payload = await httpDicesRepository.roll({ entries: [entry] })
      const diceTotal = payload.groups.reduce((sum, group) => sum + group.total, 0)
      const total = diceTotal + entry.modifier

      setHistory((currentHistory) => [
        {
          id: createHistoryId(),
          provider: payload.provider ?? "local",
          groups: payload.groups,
          diceTotal,
          modifier: entry.modifier,
          total,
          rolledAt: new Date(),
        },
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
        <header className={styles.header}>
          <h1 id="dices-title" className={styles.srOnly}>Dados</h1>
          <div className={styles.headerTabs} role="tablist" aria-label="Visualização de dados">
            <button
              type="button"
              className={`${styles.headerTab} ${activeView === "dices" ? styles.headerTabActive : ""}`}
              onClick={() => setActiveView("dices")}
              role="tab"
              aria-selected={activeView === "dices"}
            >
              Dados
            </button>
            <button
              type="button"
              className={`${styles.headerTab} ${activeView === "history" ? styles.headerTabActive : ""}`}
              onClick={() => setActiveView("history")}
              role="tab"
              aria-selected={activeView === "history"}
            >
              Historico
            </button>
          </div>
        </header>

        {activeView === "dices" ? (
          <>
            <div className={styles.formulaPreview} aria-label="Dados selecionados">
              {currentFormula}
            </div>

            <form className={styles.rollForm} onSubmit={handleSubmit}>
              <div className={styles.stepperField}>
                <span>Quantidade</span>
                <div className={styles.stepperControl}>
                  <button
                    type="button"
                    onPointerDown={() => startHoldIncrement(() => adjustDiceCount(-1))}
                    onPointerUp={stopHoldIncrement}
                    onPointerLeave={stopHoldIncrement}
                    onPointerCancel={stopHoldIncrement}
                    aria-label="Diminuir quantidade"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={MAX_DICE_COUNT}
                    value={diceCount}
                    onChange={(event) => updateDiceCountInput(event.target.value)}
                    aria-label="Quantidade de dados"
                  />
                  <button
                    type="button"
                    onPointerDown={() => startHoldIncrement(() => adjustDiceCount(1))}
                    onPointerUp={stopHoldIncrement}
                    onPointerLeave={stopHoldIncrement}
                    onPointerCancel={stopHoldIncrement}
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.stepperField}>
                <span>Modificar</span>
                <div className={styles.stepperControl}>
                  <button
                    type="button"
                    onPointerDown={() => startHoldIncrement(() => adjustModifier(-1))}
                    onPointerUp={stopHoldIncrement}
                    onPointerLeave={stopHoldIncrement}
                    onPointerCancel={stopHoldIncrement}
                    aria-label="Diminuir modificador"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={modifier}
                    onChange={(event) => {
                      setModifier(event.target.value)
                      setError(null)
                    }}
                    aria-label="Modificador"
                  />
                  <button
                    type="button"
                    onPointerDown={() => startHoldIncrement(() => adjustModifier(1))}
                    onPointerUp={stopHoldIncrement}
                    onPointerLeave={stopHoldIncrement}
                    onPointerCancel={stopHoldIncrement}
                    aria-label="Aumentar modificador"
                  >
                    +
                  </button>
                </div>
              </div>
            </form>

            <div className={styles.dicePicker} aria-label="Lados do dado">
              {PRESET_DICE_SIDES.map((side) => (
                <button
                  key={side}
                  type="button"
                  className={`${styles.dicePresetButton} ${Number(diceSides) === side ? styles.dicePresetButtonActive : ""}`}
                  onClick={() => selectDiceSides(side)}
                >
                  d{side}
                </button>
              ))}
              <button
                type="button"
                className={`${styles.dicePresetButton} ${isCustomDiceOpen ? styles.dicePresetButtonActive : ""}`}
                onClick={() => setIsCustomDiceOpen((currentState) => !currentState)}
              >
                Customizavel
              </button>
            </div>

            {isCustomDiceOpen ? (
              <div className={styles.customDicePanel}>
                <div className={styles.customDiceControls}>
                  <label className={styles.diceField}>
                    <span>Lados custom</span>
                    <input
                      type="number"
                      min={2}
                      max={MAX_DICE_SIDES}
                      value={customDiceSidesDraft}
                      onChange={(event) => setCustomDiceSidesDraft(event.target.value)}
                    />
                  </label>
                  <button type="button" className={styles.customDiceAddButton} onClick={addCustomDiceSides}>
                    Adicionar
                  </button>
                </div>

                {customSides.length > 0 ? (
                  <div className={styles.customDiceList}>
                    {customSides.map((side) => (
                      <button
                        key={side}
                        type="button"
                        className={`${styles.dicePresetButton} ${Number(diceSides) === side ? styles.dicePresetButtonActive : ""}`}
                        onClick={() => selectDiceSides(side)}
                      >
                        d{side}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className={styles.customDiceEmpty}>Nenhum dado customizado criado.</p>
                )}
              </div>
            ) : null}

            <button type="button" className={styles.rollButton} disabled={isRolling} onClick={() => void rollDices()}>
              <Dice5 size={18} />
              {isRolling ? "Girando..." : "Girar"}
            </button>

            {error ? <p className={styles.errorMessage}>{error}</p> : null}

            <section className={styles.resultStream} aria-label="Resultados">
              {latestRoll ? (
                <article className={styles.streamCard}>
                  <div className={styles.rollHeader}>
                    <span className={styles.actionTypeBadge}>
                      {latestRoll.provider === "random-org" ? "random.org" : "local"}
                    </span>
                    {canShowLatestStats ? (
                      <button
                        type="button"
                        className={styles.statsButton}
                        onClick={() => setIsRollStatsModalOpen(true)}
                      >
                        Estatisticas
                      </button>
                    ) : null}
                    <span className={styles.streamTimeInline}>{formatTime(latestRoll.rolledAt)}</span>
                  </div>

                  <div className={styles.rollSummary}>
                    <strong className={styles.rollFormula}>
                      {latestRoll.groups.map((group) => `${group.diceCount}d${group.diceSides}`).join(" + ")}
                      {latestRoll.modifier ? `${latestRoll.modifier > 0 ? "+" : ""}${latestRoll.modifier}` : ""}
                    </strong>
                    <div className={styles.rollMetrics}>
                      <div className={styles.totalPanel}>
                        <span>Total</span>
                        <strong>{latestRoll.total}</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.diceResultGrid}>
                    {latestRoll.groups.map((group, index) => (
                      group.results.map((result, resultIndex) => (
                        <span
                          key={`${latestRoll.id}-dice-${index}-${resultIndex}`}
                          className={`${styles.diceResultCard} ${getDiceResultTone(result, group.diceSides)}`}
                        >
                          <strong>{result}</strong>
                        </span>
                      ))
                    ))}
                  </div>

                  {isRollStatsModalOpen && latestStats ? (
                    <div
                      className={styles.modalBackdrop}
                      role="presentation"
                      onClick={() => setIsRollStatsModalOpen(false)}
                    >
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
                            onClick={() => setIsRollStatsModalOpen(false)}
                            aria-label="Fechar dados da rolagem"
                          >
                            Fechar
                          </button>
                        </div>

                        <div className={styles.statsGrid}>
                          <div className={styles.statItem}>
                            <span>Maior numero</span>
                            <strong>{latestStats.max}</strong>
                          </div>
                          <div className={styles.statItem}>
                            <span>Menor numero</span>
                            <strong>{latestStats.min}</strong>
                          </div>
                          <div className={styles.statItem}>
                            <span>Altos</span>
                            <strong>{latestStats.highCount}</strong>
                          </div>
                          <div className={styles.statItem}>
                            <span>Baixos</span>
                            <strong>{latestStats.lowCount}</strong>
                          </div>
                          <div className={styles.statItem}>
                            <span>Media</span>
                            <strong>{latestStats.average.toFixed(2)}</strong>
                          </div>
                        </div>
                      </section>
                    </div>
                  ) : null}
                </article>
              ) : (
                <div className={styles.emptyState}>
                  <Dice5 size={28} />
                  <p>Nenhuma rolagem ainda.</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className={styles.historyPanel} aria-label="Historico de rolagens">
            {history.length > 0 ? (
              <div className={styles.historyActions}>
                <button type="button" className={styles.clearHistoryButton} onClick={clearPreviousRolls}>
                  Limpar historico
                </button>
              </div>
            ) : null}

            {historyRolls.length > 0 ? (
              <div className={styles.historyList}>
                {historyRolls.map((roll) => (
                  <article
                    key={roll.id}
                    className={`${styles.historyCard} ${expandedHistoryId === roll.id ? styles.historyCardExpanded : ""}`}
                  >
                    <div className={styles.historyCardTop}>
                      <strong className={styles.historyFormula}>
                        {roll.groups.map((group) => `${group.diceCount}d${group.diceSides}`).join(" + ")}
                        {roll.modifier ? `${roll.modifier > 0 ? "+" : ""}${roll.modifier}` : ""} = {roll.total}
                      </strong>
                      <span>{formatTime(roll.rolledAt)}</span>
                      <button
                        type="button"
                        className={styles.historyToggleButton}
                        onClick={() => toggleHistoryCard(roll.id)}
                        aria-expanded={expandedHistoryId === roll.id}
                        aria-label={expandedHistoryId === roll.id ? "Recolher rolagem" : "Expandir rolagem"}
                      >
                        {expandedHistoryId === roll.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>

                    {expandedHistoryId === roll.id ? (
                      <div className={styles.historyExpandedDetails}>
                        <div className={styles.rollSummary}>
                          <strong className={styles.rollFormula}>
                            {roll.groups.map((group) => `${group.diceCount}d${group.diceSides}`).join(" + ")}
                            {roll.modifier ? `${roll.modifier > 0 ? "+" : ""}${roll.modifier}` : ""}
                          </strong>
                          <div className={styles.rollMetrics}>
                            <div className={styles.totalPanel}>
                              <span>Total</span>
                              <strong>{roll.total}</strong>
                            </div>
                          </div>
                        </div>

                        <div className={styles.diceResultGrid}>
                          {roll.groups.map((group, index) => (
                            group.results.map((result, resultIndex) => (
                              <span
                                key={`${roll.id}-history-dice-${index}-${resultIndex}`}
                                className={`${styles.diceResultCard} ${getDiceResultTone(result, group.diceSides)}`}
                              >
                                <strong>{result}</strong>
                              </span>
                            ))
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Dice5 size={28} />
                <p>Nenhuma rolagem anterior.</p>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  )
}
