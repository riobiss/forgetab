"use client"

import { useEffect, useMemo, useState } from "react"
import styles from "../RpgDashboardPage.module.css"

type CharacterType = "player" | "npc" | "monster"
type DetailTab = "attributes" | "skills" | "status"

type StatusItem = {
  key: string
  label: string
  max: number
  current: number
}

type SpectatorCharacter = {
  id: string
  name: string
  characterType: CharacterType
  statusItems: StatusItem[]
  attributes: Record<string, number>
  skills: Record<string, number>
}

type Props = {
  rpgId: string
  characters: SpectatorCharacter[]
  attributeLabels: Record<string, string>
  skillLabels: Record<string, string>
  statusLabels: Record<string, string>
}

const CATEGORY_OPTIONS: Array<{ key: CharacterType; label: string }> = [
  { key: "player", label: "Players" },
  { key: "monster", label: "Criaturas" },
  { key: "npc", label: "Npc" },
]

export default function SpectatorVisionPanel({
  rpgId,
  characters,
  attributeLabels,
  skillLabels,
  statusLabels,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CharacterType>("player")
  const [selectedCharacterId, setSelectedCharacterId] = useState("")
  const [detailTab, setDetailTab] = useState<DetailTab>("attributes")
  const [statusCurrentByCharacter, setStatusCurrentByCharacter] = useState<
    Record<string, Record<string, number>>
  >({})
  const [statusStepInputByCharacter, setStatusStepInputByCharacter] = useState<
    Record<string, Record<string, string>>
  >({})

  const filteredCharacters = useMemo(
    () => characters.filter((character) => character.characterType === selectedCategory),
    [characters, selectedCategory],
  )

  const selectedCharacter = useMemo(
    () => filteredCharacters.find((character) => character.id === selectedCharacterId) ?? null,
    [filteredCharacters, selectedCharacterId],
  )

  useEffect(() => {
    if (filteredCharacters.length === 0) {
      setSelectedCharacterId("")
      return
    }

    const isCurrentCharacterVisible = filteredCharacters.some(
      (character) => character.id === selectedCharacterId,
    )
    if (!isCurrentCharacterVisible) {
      setSelectedCharacterId(filteredCharacters[0].id)
    }
  }, [filteredCharacters, selectedCharacterId])

  const detailEntries = useMemo(() => {
    if (!selectedCharacter) return []

    const source =
      detailTab === "attributes" ? selectedCharacter.attributes : selectedCharacter.skills
    const labels = detailTab === "attributes" ? attributeLabels : skillLabels

    return Object.entries(source)
      .filter(([, value]) => Number(value) > 0)
      .sort((left, right) => {
        const leftLabel = labels[left[0]] ?? left[0]
        const rightLabel = labels[right[0]] ?? right[0]
        return leftLabel.localeCompare(rightLabel, "pt-BR")
      })
  }, [attributeLabels, detailTab, selectedCharacter, skillLabels])

  useEffect(() => {
    if (!selectedCharacter) return
    if (statusCurrentByCharacter[selectedCharacter.id]) return

    const defaults = Object.fromEntries(
      selectedCharacter.statusItems.map((item) => [item.key, item.current]),
    )
    const storageKey = `rpg-spectator-status-current:${rpgId}:${selectedCharacter.id}`

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        setStatusCurrentByCharacter((prev) => ({ ...prev, [selectedCharacter.id]: defaults }))
        return
      }

      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setStatusCurrentByCharacter((prev) => ({ ...prev, [selectedCharacter.id]: defaults }))
        return
      }

      const loaded = selectedCharacter.statusItems.reduce<Record<string, number>>((acc, item) => {
        const candidate = (parsed as Record<string, unknown>)[item.key]
        const parsedNumber =
          typeof candidate === "number" && Number.isFinite(candidate)
            ? Math.floor(candidate)
            : defaults[item.key] ?? item.current
        acc[item.key] = Math.max(0, Math.min(item.max, parsedNumber))
        return acc
      }, {})

      setStatusCurrentByCharacter((prev) => ({ ...prev, [selectedCharacter.id]: loaded }))
    } catch {
      setStatusCurrentByCharacter((prev) => ({ ...prev, [selectedCharacter.id]: defaults }))
    }
  }, [rpgId, selectedCharacter, statusCurrentByCharacter])

  useEffect(() => {
    if (!selectedCharacter) return
    const current = statusCurrentByCharacter[selectedCharacter.id]
    if (!current) return

    const storageKey = `rpg-spectator-status-current:${rpgId}:${selectedCharacter.id}`
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(current))
    } catch {
      // Ignora erro de escrita local para nao quebrar interacao.
    }
  }, [rpgId, selectedCharacter, statusCurrentByCharacter])

  const selectedCharacterStatus = selectedCharacter
    ? selectedCharacter.statusItems.map((item) => ({
        ...item,
        current:
          statusCurrentByCharacter[selectedCharacter.id]?.[item.key] ?? Number(item.current ?? 0),
      }))
    : []

  function getStatusStepAmount(characterId: string, statusKey: string) {
    const raw = (statusStepInputByCharacter[characterId]?.[statusKey] ?? "").trim()
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return 1
    const step = Math.floor(parsed)
    return step >= 1 ? step : 1
  }

  function updateStatus(statusKey: string, delta: number) {
    if (!selectedCharacter) return

    const status = selectedCharacter.statusItems.find((item) => item.key === statusKey)
    if (!status) return

    const characterId = selectedCharacter.id
    const current = statusCurrentByCharacter[characterId]?.[statusKey] ?? status.current
    const next = Math.max(0, Math.min(status.max, current + delta))
    if (next === current) return

    setStatusCurrentByCharacter((prev) => ({
      ...prev,
      [characterId]: {
        ...(prev[characterId] ?? {}),
        [statusKey]: next,
      },
    }))
  }

  return (
    <section className={styles.spectatorSection}>
      <button
        type="button"
        className={styles.spectatorOpenButton}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        {isOpen ? "Fechar espectador" : "Espectar personagens"}
      </button>

      {isOpen ? (
        <div className={styles.spectatorPanel}>
          <div className={styles.spectatorCategoryRow}>
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`${styles.spectatorCategoryButton} ${
                  selectedCategory === option.key ? styles.spectatorCategoryButtonActive : ""
                }`}
                onClick={() => setSelectedCategory(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {filteredCharacters.length === 0 ? (
            <p className={styles.spectatorEmptyMessage}>Nenhum personagem nesta categoria.</p>
          ) : (
            <div className={styles.spectatorCharactersList}>
              {filteredCharacters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  className={`${styles.spectatorCharacterButton} ${
                    selectedCharacter?.id === character.id
                      ? styles.spectatorCharacterButtonActive
                      : ""
                  }`}
                  onClick={() => setSelectedCharacterId(character.id)}
                >
                  {character.name}
                </button>
              ))}
            </div>
          )}

          {selectedCharacter ? (
            <div className={styles.spectatorDetails}>
              <p className={styles.spectatorSelectedName}>{selectedCharacter.name}</p>

              <div className={styles.spectatorTabRow}>
                <button
                  type="button"
                  className={`${styles.spectatorTabButton} ${
                    detailTab === "attributes" ? styles.spectatorTabButtonActive : ""
                  }`}
                  onClick={() => setDetailTab("attributes")}
                >
                  Atributos
                </button>
                <button
                  type="button"
                  className={`${styles.spectatorTabButton} ${
                    detailTab === "skills" ? styles.spectatorTabButtonActive : ""
                  }`}
                  onClick={() => setDetailTab("skills")}
                >
                  Pericias
                </button>
                <button
                  type="button"
                  className={`${styles.spectatorTabButton} ${
                    detailTab === "status" ? styles.spectatorTabButtonActive : ""
                  }`}
                  onClick={() => setDetailTab("status")}
                >
                  Status
                </button>
              </div>

              {detailTab === "status" ? (
                selectedCharacterStatus.length > 0 ? (
                  <div className={styles.spectatorStatusList}>
                    {selectedCharacterStatus.map((status) => {
                      const step = getStatusStepAmount(selectedCharacter.id, status.key)
                      return (
                        <div key={status.key} className={styles.spectatorStatusRow}>
                          <span>
                            {statusLabels[status.key] ?? status.label}: {status.current}/{status.max}
                          </span>
                          <div className={styles.spectatorStatusActions}>
                            <button
                              type="button"
                              className={styles.spectatorStatusButton}
                              onClick={() => updateStatus(status.key, -step)}
                              disabled={status.current <= 0}
                            >
                              -
                            </button>
                            <button
                              type="button"
                              className={styles.spectatorStatusButton}
                              onClick={() => updateStatus(status.key, step)}
                              disabled={status.current >= status.max}
                            >
                              +
                            </button>
                            <input
                              type="number"
                              onWheel={(event) => event.currentTarget.blur()}
                              min={1}
                              step={1}
                              className={styles.spectatorStatusStepInput}
                              value={
                                statusStepInputByCharacter[selectedCharacter.id]?.[status.key] ??
                                ""
                              }
                              onChange={(event) =>
                                setStatusStepInputByCharacter((prev) => ({
                                  ...prev,
                                  [selectedCharacter.id]: {
                                    ...(prev[selectedCharacter.id] ?? {}),
                                    [status.key]: event.target.value,
                                  },
                                }))
                              }
                              placeholder="1"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className={styles.spectatorEmptyMessage}>Nenhum status encontrado.</p>
                )
              ) : detailEntries.length > 0 ? (
                <ul className={styles.spectatorDetailsList}>
                  {detailEntries.map(([key, value]) => (
                    <li key={key}>
                      {detailTab === "attributes"
                        ? (attributeLabels[key] ?? key)
                        : (skillLabels[key] ?? key)}
                      : {value}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.spectatorEmptyMessage}>
                  Nenhum valor encontrado para esta visualizacao.
                </p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
