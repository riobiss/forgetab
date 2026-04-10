"use client"

import { useEffect, useMemo, useState } from "react"
import { Dice5, X } from "lucide-react"
import {
  httpRpgCampaignRepository,
  type CampaignCreatureOption,
  type CampaignItemOption,
} from "@/infrastructure/rpgCampaign/repositories/httpRpgCampaignRepository"
import styles from "./RpgCampaignRoomPage.module.css"

type RollTarget = {
  section: "statuses" | "attributes" | "skills"
  key: string
  label: string
}

type RollConfig = RollTarget & {
  dicePerLevel: number
  diceSides: number
}

type Props = {
  rpgId: string
  campaignId: string
  combatId: string
  isBusy: boolean
  onClose: () => void
  runAction: (action: () => Promise<{ message?: string }>) => Promise<void>
}

const rarityOptions = [
  { value: "", label: "Qualquer raridade" },
  { value: "common", label: "Comum" },
  { value: "uncommon", label: "Incomum" },
  { value: "rare", label: "Raro" },
  { value: "epic", label: "Epico" },
  { value: "legendary", label: "Lendario" },
]

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function rollDice(diceCount: number, diceSides: number) {
  return Array.from({ length: diceCount }, () => Math.floor(Math.random() * diceSides) + 1)
}

function pickRandomItems(items: CampaignItemOption[], quantity: number) {
  if (items.length === 0 || quantity <= 0) return []
  return Array.from({ length: quantity }, () => items[Math.floor(Math.random() * items.length)])
    .filter((item): item is CampaignItemOption => Boolean(item))
    .map((item) => ({ id: item.id, name: item.name, rarity: item.rarity }))
}

export function CampaignCreatureCombatModal({
  rpgId,
  campaignId,
  combatId,
  isBusy,
  onClose,
  runAction,
}: Props) {
  const [creatures, setCreatures] = useState<CampaignCreatureOption[]>([])
  const [items, setItems] = useState<CampaignItemOption[]>([])
  const [selectedCreatureId, setSelectedCreatureId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [itemRarity, setItemRarity] = useState("")
  const [itemQuantity, setItemQuantity] = useState("0")
  const [itemMode, setItemMode] = useState<"none" | "same" | "selectedRandom" | "rarityRandom">("none")
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [rollConfigs, setRollConfigs] = useState<RollConfig[]>([])
  const [rollTarget, setRollTarget] = useState<RollTarget | null>(null)
  const [dicePerLevel, setDicePerLevel] = useState("1")
  const [diceSides, setDiceSides] = useState("6")
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      httpRpgCampaignRepository.fetchCombatCreatureOptions(rpgId),
      httpRpgCampaignRepository.fetchCombatItemOptions(rpgId),
    ])
      .then(([nextCreatures, nextItems]) => {
        if (!isMounted) return
        setCreatures(nextCreatures)
        setItems(nextItems)
        setSelectedCreatureId(nextCreatures[0]?.id ?? "")
      })
      .catch((error) => {
        if (!isMounted) return
        setLoadError(error instanceof Error ? error.message : "Nao foi possivel carregar criaturas.")
      })

    return () => {
      isMounted = false
    }
  }, [rpgId])

  const selectedCreature = creatures.find((creature) => creature.id === selectedCreatureId) ?? null
  const filteredItems = useMemo(
    () => (itemRarity ? items.filter((item) => item.rarity === itemRarity) : items),
    [itemRarity, items],
  )
  const statSections = useMemo(() => {
    if (!selectedCreature) return []
    return [
      { key: "statuses" as const, label: "Status", values: asRecord(selectedCreature.statuses) },
      { key: "attributes" as const, label: "Atributos", values: asRecord(selectedCreature.attributes) },
      { key: "skills" as const, label: "Pericias", values: asRecord(selectedCreature.skills) },
    ]
  }, [selectedCreature])

  function upsertRollConfig(target: RollTarget, nextDicePerLevel: number, nextDiceSides: number) {
    setRollConfigs((currentConfigs) => {
      const withoutTarget = currentConfigs.filter(
        (config) => config.section !== target.section || config.key !== target.key,
      )
      return [...withoutTarget, { ...target, dicePerLevel: nextDicePerLevel, diceSides: nextDiceSides }]
    })
  }

  function getRollConfig(section: RollTarget["section"], key: string) {
    return rollConfigs.find((config) => config.section === section && config.key === key) ?? null
  }

  function buildStatRolls(nextQuantity: number) {
    const level = Math.max(1, Math.trunc(Number(selectedCreature?.progressionCurrent ?? 1)))
    return Array.from({ length: nextQuantity }, (_, creatureIndex) => ({
      creatureIndex,
      rolls: rollConfigs.map((config) => {
        const diceCount = Math.max(1, Math.min(100, config.dicePerLevel * level))
        const sides = Math.max(2, Math.min(1000, config.diceSides))
        const results = rollDice(diceCount, sides)
        return {
          section: config.section,
          key: config.key,
          label: config.label,
          dice: `${diceCount}d${sides}`,
          results,
          total: results.reduce((sum, result) => sum + result, 0),
        }
      }),
    }))
  }

  function buildItemAssignments(nextQuantity: number, nextItemQuantity: number) {
    const selectedItems = items.filter((item) => selectedItemIds.includes(item.id))
    const randomPool = itemMode === "selectedRandom" ? selectedItems : filteredItems

    return Array.from({ length: nextQuantity }, (_, creatureIndex) => {
      const assignedItems =
        itemMode === "same"
          ? selectedItems.map((item) => ({ id: item.id, name: item.name, rarity: item.rarity }))
          : itemMode === "selectedRandom" || itemMode === "rarityRandom"
            ? pickRandomItems(randomPool, nextItemQuantity)
            : []

      return {
        creatureIndex,
        items: assignedItems,
      }
    })
  }

  async function submitCreatures() {
    if (!selectedCreature) return
    const nextQuantity = Math.max(1, Math.min(20, Math.trunc(Number(quantity) || 1)))
    const nextItemQuantity = Math.max(0, Math.min(50, Math.trunc(Number(itemQuantity) || 0)))

    await runAction(() =>
      httpRpgCampaignRepository.addCombatCreatures(rpgId, campaignId, combatId, {
        sourceCharacterId: selectedCreature.id,
        quantity: nextQuantity,
        items: {
          mode: itemMode,
          rarity: itemRarity || null,
          quantity: nextItemQuantity,
          selectedItemIds,
          assignments: buildItemAssignments(nextQuantity, nextItemQuantity),
        },
        rollConfig: rollConfigs,
        statRolls: buildStatRolls(nextQuantity),
      }),
    )
    onClose()
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.creatureCombatModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="combat-creatures-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.actionModalHeader}>
          <h2 id="combat-creatures-title" className={styles.actionModalTitle}>
            Criaturas
          </h2>
          <button type="button" className={styles.closeChatButton} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {loadError ? <p className={styles.feedbackError}>{loadError}</p> : null}

        <div className={styles.creatureCombatGrid}>
          <label className={styles.creatureCombatField}>
            <span>Criatura</span>
            <select value={selectedCreatureId} onChange={(event) => setSelectedCreatureId(event.target.value)}>
              {creatures.map((creature) => (
                <option key={creature.id} value={creature.id}>
                  {creature.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.creatureCombatField}>
            <span>Quantidade de criaturas</span>
            <input type="number" min={1} max={20} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label className={styles.creatureCombatField}>
            <span>Raridade de itens</span>
            <select value={itemRarity} onChange={(event) => setItemRarity(event.target.value)}>
              {rarityOptions.map((option) => (
                <option key={option.value || "any"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.creatureCombatField}>
            <span>Quantidade de itens</span>
            <input type="number" min={0} max={50} value={itemQuantity} onChange={(event) => setItemQuantity(event.target.value)} />
          </label>
        </div>

        <div className={styles.creatureCombatModes}>
          <label><input type="radio" checked={itemMode === "none"} onChange={() => setItemMode("none")} /> Sem itens</label>
          <label><input type="radio" checked={itemMode === "same"} onChange={() => setItemMode("same")} /> Todos recebem os selecionados</label>
          <label><input type="radio" checked={itemMode === "selectedRandom"} onChange={() => setItemMode("selectedRandom")} /> Aleatorio entre selecionados</label>
          <label><input type="radio" checked={itemMode === "rarityRandom"} onChange={() => setItemMode("rarityRandom")} /> Aleatorio por raridade</label>
        </div>

        {itemMode === "same" || itemMode === "selectedRandom" ? (
          <div className={styles.creatureItemList}>
            {filteredItems.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={selectedItemIds.includes(item.id)}
                  onChange={(event) => {
                    setSelectedItemIds((currentIds) =>
                      event.target.checked
                        ? [...currentIds, item.id]
                        : currentIds.filter((itemId) => itemId !== item.id),
                    )
                  }}
                />
                {item.name}
              </label>
            ))}
          </div>
        ) : null}

        <div className={styles.creatureRollSections}>
          {statSections.map((section) => (
            <section key={section.key} className={styles.creatureRollSection}>
              <h3>{section.label}</h3>
              {Object.entries(section.values).length === 0 ? (
                <p className={styles.emptyState}>Nada configurado.</p>
              ) : (
                Object.entries(section.values).map(([key, value]) => {
                  const config = getRollConfig(section.key, key)
                  return (
                    <div key={`${section.key}-${key}`} className={styles.creatureRollRow}>
                      <span>{key}</span>
                      <input value={toNumber(value)} readOnly />
                      <button
                        type="button"
                        onClick={() => {
                          setRollTarget({ section: section.key, key, label: key })
                          setDicePerLevel(String(config?.dicePerLevel ?? 1))
                          setDiceSides(String(config?.diceSides ?? 6))
                        }}
                        aria-label={`Configurar dado de ${key}`}
                      >
                        <Dice5 size={15} />
                      </button>
                      {config ? <small>{config.dicePerLevel} por nivel d{config.diceSides}</small> : null}
                    </div>
                  )
                })
              )}
            </section>
          ))}
        </div>

        <button
          type="button"
          className={styles.combatPrimaryButton}
          onClick={() => void submitCreatures()}
          disabled={isBusy || !selectedCreature}
        >
          Adicionar ao combate
        </button>

        {rollTarget ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={() => setRollTarget(null)}>
            <section
              className={styles.confirmActionModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="creature-roll-title"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="creature-roll-title" className={styles.confirmActionTitle}>
                Rolar {rollTarget.label}
              </h2>
              <label className={styles.creatureCombatField}>
                <span>Dados por nivel</span>
                <input type="number" min={1} max={100} value={dicePerLevel} onChange={(event) => setDicePerLevel(event.target.value)} />
              </label>
              <label className={styles.creatureCombatField}>
                <span>Lados</span>
                <input type="number" min={2} max={1000} value={diceSides} onChange={(event) => setDiceSides(event.target.value)} />
              </label>
              <button
                type="button"
                className={styles.combatPrimaryButton}
                onClick={() => {
                  upsertRollConfig(
                    rollTarget,
                    Math.max(1, Math.trunc(Number(dicePerLevel) || 1)),
                    Math.max(2, Math.trunc(Number(diceSides) || 6)),
                  )
                  setRollTarget(null)
                }}
              >
                Aplicar
              </button>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  )
}
