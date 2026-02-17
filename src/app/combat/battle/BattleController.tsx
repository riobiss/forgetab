"use client"

import styles from "./Battle.module.css"
import SelectAttack from "./attacks/SelectAttack"
import SelectTarget from "./attacks/select-target/SelectTarget"
import { Weapon } from "@/types/Weapon"
import { useMemo, useState } from "react"
import { BattleLog, BattleSystemLog } from "@/types/BattleLog"
import BattleLogs from "./battle-log/BattleLogs"
import applyDamageWeapon from "@/lib/applyDamage/applyDamageWeapon"
import weapons from "@/data/rpg/world-of-clans/weapons"
import { BaseCharacter } from "@/types/BaseCharacter"
import { Ability } from "@/types/Ability"
import { TurnPhase } from "@/types/TurnPhase"
import { BattleHeader } from "./battle-header/BattleHeader"
import BattleTurnQueue from "./turn-queue/BattleTurnQueue"
import initTurnQueue from "@/lib/turns/initTurnQueue"
import { Button } from "@/components/button"

type Props = {
  characters: BaseCharacter[]
}

type CharacterWithAbilities = BaseCharacter & {
  identity: BaseCharacter["identity"] & {
    class?: string
  }
  abilities?: {
    classMainIds?: string[]
    classReinforcementIds?: string[]
  }
}

const BATTLE_PHASES: TurnPhase[] = ["Ação", "Ação bonus", "Reação", "Evasão"]

function getCharacterOwnedAbilities(character: BaseCharacter): Ability[] {
  const characterWithAbilities = character as CharacterWithAbilities
  if (!characterWithAbilities.identity.class) return []
  return []
}

function canPlayPhase(character: BaseCharacter, phase: TurnPhase): boolean {
  if (phase === "Ação") return true
  if (phase === "Ação bonus") return getCharacterOwnedAbilities(character).length > 0
  if (phase === "Reação")
    return (
      character.defense.base + character.defense.armor + character.defense.shield > 0
    )
  if (phase === "Evasão") return character.defense.evasion > 0

  return false
}

function getNextPlayablePhaseIndex(
  character: BaseCharacter,
  startAt: number,
): number {
  for (let index = startAt; index < BATTLE_PHASES.length; index += 1) {
    if (canPlayPhase(character, BATTLE_PHASES[index])) {
      return index
    }
  }

  return -1
}

export default function BattleScreen({ characters }: Props) {
  const [battleCharacters, setBattleCharacters] =
    useState<BaseCharacter[]>(characters)
  const [weapon, setWeapon] = useState<Weapon | null>(null)
  const [logs, setLogs] = useState<BattleLog[]>([])
  const [round, setRound] = useState(1)
  const [completedTurns, setCompletedTurns] = useState(0)
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)

  const turnQueue = useMemo(
    () => initTurnQueue(battleCharacters).map((turn) => turn.entity),
    [battleCharacters],
  )

  const current = turnQueue[currentTurnIndex] ?? null
  const phase = BATTLE_PHASES[currentPhaseIndex]

  const currentWeapons = useMemo(
    () =>
      current
        ? weapons.filter((w) => current.equipment.weaponIds.includes(w.id))
        : [],
    [current],
  )
  const currentAbilities = useMemo(
    () => (current ? getCharacterOwnedAbilities(current) : []),
    [current],
  )

  function pushSystemLog(log: Omit<BattleSystemLog, "type">) {
    setLogs((prev) => [...prev, { type: "system", ...log }])
  }

  function advancePhaseOrTurn() {
    if (!current || turnQueue.length === 0) return

    const nextPhaseIndex = getNextPlayablePhaseIndex(current, currentPhaseIndex + 1)

    if (nextPhaseIndex !== -1) {
      setCurrentPhaseIndex(nextPhaseIndex)
      setWeapon(null)
      return
    }

    const nextRawIndex = currentTurnIndex + 1
    const wrappedRound = nextRawIndex >= turnQueue.length
    const nextTurnIndex = wrappedRound ? 0 : nextRawIndex
    const nextCharacter = turnQueue[nextTurnIndex] ?? null
    const nextRound = wrappedRound ? round + 1 : round
    const nextTurnNumber = completedTurns + 1

    pushSystemLog({
      kind: "turn",
      turn: nextTurnNumber,
      round,
      actorId: current.id,
      message: `Turno de ${current.identity.name} concluido.`,
    })

    if (wrappedRound) {
      pushSystemLog({
        kind: "round",
        turn: nextTurnNumber,
        round: nextRound,
        message: `Nova rodada ${nextRound} iniciada.`,
      })
    }

    setCompletedTurns(nextTurnNumber)
    setRound(nextRound)
    setCurrentTurnIndex(nextTurnIndex)
    setCurrentPhaseIndex(
      nextCharacter ? getNextPlayablePhaseIndex(nextCharacter, 0) : 0,
    )
    setWeapon(null)
  }

  function handleAttack(target: BaseCharacter) {
    if (!weapon || !current) return

    const result = applyDamageWeapon(current, target, weapon)

    setBattleCharacters((prev) =>
      prev.map((c) =>
        c.id === result.updatedTarget.id ? result.updatedTarget : c,
      ),
    )
    setLogs((prev) => [...prev, result.log])
    advancePhaseOrTurn()
  }

  if (!current) {
    return (
      <div className={styles.container}>
        <h2>Combate encerrado</h2>
        <BattleLogs logs={logs} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <BattleHeader
        round={round}
        turnInRound={currentTurnIndex + 1}
        totalTurnsInRound={turnQueue.length}
        phase={phase}
        current={current}
      />

      {phase === "Ação" && !current.meta.isNPC && !weapon && (
        <SelectAttack
          attacker={current}
          weapons={currentWeapons}
          abilities={currentAbilities}
          onWeaponSelect={setWeapon}
        />
      )}

      {phase === "Ação" && !current.meta.isNPC && weapon && (
        <SelectTarget
          characters={battleCharacters.filter((c) => c.id !== current.id)}
          onSelect={handleAttack}
        />
      )}

      {(phase !== "Ação" || current.meta.isNPC || !weapon) && (
        <Button onClick={advancePhaseOrTurn}>Concluir fase</Button>
      )}

      <BattleTurnQueue characters={turnQueue} currentCharacterId={current.id} />
      <BattleLogs logs={logs} />
    </div>
  )
}
