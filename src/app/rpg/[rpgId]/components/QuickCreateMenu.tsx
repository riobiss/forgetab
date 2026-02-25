"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Backpack,
  BookOpen,
  Minus,
  PackagePlus,
  Plus,
  PlusCircle,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react"
import styles from "../page.module.css"

type Props = {
  rpgId: string
}

type CharacterSummary = {
  id: string
  name: string
  classKey: string | null
  characterType: "player" | "npc" | "monster"
}

type CharactersPayload = {
  characters?: CharacterSummary[]
  message?: string
}

type ClassSummary = {
  key: string
  label: string
}

type ClassesPayload = {
  classes?: ClassSummary[]
  message?: string
}

type RpgPayload = {
  rpg?: {
    costResourceName?: string
  }
  message?: string
}

type GrantPointsPayload = {
  success?: boolean
  message?: string
  remainingPoints?: number
}

export default function QuickCreateMenu({ rpgId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPointsPanel, setShowPointsPanel] = useState(false)
  const [loadingPanel, setLoadingPanel] = useState(false)
  const [panelError, setPanelError] = useState("")
  const [panelMessage, setPanelMessage] = useState("")
  const [costResourceName, setCostResourceName] = useState("Skill Points")
  const [amountInput, setAmountInput] = useState("1")
  const [players, setPlayers] = useState<Array<{ id: string; name: string; classLabel: string }>>([])
  const [loadingActionKey, setLoadingActionKey] = useState("")
  const loadingPanelRef = useRef(false)
  const loadingGrantRef = useRef(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const hasPlayers = useMemo(() => players.length > 0, [players])
  const selectedAmount = useMemo(() => {
    const parsed = Number(amountInput)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null
    }
    return parsed
  }, [amountInput])

  const loadPointsPanelData = useCallback(async () => {
    if (loadingPanelRef.current) return
    loadingPanelRef.current = true
    try {
      setLoadingPanel(true)
      setPanelError("")
      setPanelMessage("")

      const [charactersResponse, classesResponse, rpgResponse] = await Promise.all([
        fetch(`/api/rpg/${rpgId}/characters`),
        fetch(`/api/rpg/${rpgId}/classes`),
        fetch(`/api/rpg/${rpgId}`),
      ])

      const charactersPayload = (await charactersResponse.json()) as CharactersPayload
      const classesPayload = (await classesResponse.json()) as ClassesPayload
      const rpgPayload = (await rpgResponse.json()) as RpgPayload

      if (!charactersResponse.ok) {
        setPanelError(charactersPayload.message ?? "Nao foi possivel carregar os players.")
        return
      }

      if (!classesResponse.ok) {
        setPanelError(classesPayload.message ?? "Nao foi possivel carregar as classes.")
        return
      }

      if (!rpgResponse.ok) {
        setPanelError(rpgPayload.message ?? "Nao foi possivel carregar configuracoes do RPG.")
        return
      }

      const classLabelByKey = new Map(
        (classesPayload.classes ?? []).map((item) => [item.key, item.label]),
      )

      const playerRows = (charactersPayload.characters ?? [])
        .filter((item) => item.characterType === "player")
        .map((item) => ({
          id: item.id,
          name: item.name,
          classLabel: item.classKey ? classLabelByKey.get(item.classKey) ?? item.classKey : "Sem classe",
        }))

      setPlayers(playerRows)
      setCostResourceName(rpgPayload.rpg?.costResourceName?.trim() || "Skill Points")
      setAmountInput("1")
    } catch {
      setPanelError("Erro de conexao ao carregar distribuicao de pontos.")
    } finally {
      setLoadingPanel(false)
      loadingPanelRef.current = false
    }
  }, [rpgId])

  async function handleGrantPoint(characterId: string, playerName: string, amount: 1 | -1) {
    if (loadingGrantRef.current) return
    if (!selectedAmount) {
      setPanelError("Informe uma quantidade valida (inteiro maior que zero).")
      return
    }

    try {
      loadingGrantRef.current = true
      setLoadingActionKey(`${characterId}:${amount}`)
      setPanelError("")
      setPanelMessage("")

      const response = await fetch(`/api/characters/${characterId}/grant-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount * amount }),
      })
      const payload = (await response.json()) as GrantPointsPayload

      if (!response.ok || !payload.success) {
        setPanelError(payload.message ?? "Nao foi possivel atualizar ponto de classe.")
        return
      }

      const remainingPoints =
        typeof payload.remainingPoints === "number" ? ` (${payload.remainingPoints})` : ""
      if (amount > 0) {
        setPanelMessage(`${playerName} recebeu ${selectedAmount} ${costResourceName}.${remainingPoints}`)
      } else {
        setPanelMessage(`${playerName} perdeu ${selectedAmount} ${costResourceName}.${remainingPoints}`)
      }
    } catch {
      setPanelError("Erro de conexao ao atualizar ponto de classe.")
    } finally {
      setLoadingActionKey("")
      loadingGrantRef.current = false
    }
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current) return

      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowPointsPanel(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  return (
    <div ref={wrapperRef} className={styles.quickCreateWrapper}>
      <button
        type="button"
        className={styles.quickCreateTrigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Criar novo"
        title="Criar novo"
      >
        <PlusCircle size={16} />
      </button>

      {isOpen ? (
        <div className={styles.quickCreateMenu}>
          <Link href={`/rpg/${rpgId}/characters/new`} onClick={() => setIsOpen(false)}>
            <UserPlus size={15} />
            Criar Personagem
          </Link>
          <Link href={`/rpg/${rpgId}/edit`} onClick={() => setIsOpen(false)}>
            <Users size={15} />
            Criar Raca
          </Link>
          <Link href={`/rpg/${rpgId}/skills`} onClick={() => setIsOpen(false)}>
            <Sparkles size={15} />
            Criar Habilidade
          </Link>
          <Link href={`/rpg/${rpgId}/items/new`} onClick={() => setIsOpen(false)}>
            <PackagePlus size={15} />
            Criar Item
          </Link>
          <Link href={`/rpg/${rpgId}/library`} onClick={() => setIsOpen(false)}>
            <BookOpen size={15} />
            Biblioteca
          </Link>
          <button
            type="button"
            onClick={() => {
              const next = !showPointsPanel
              setShowPointsPanel(next)
              if (next) {
                void loadPointsPanelData()
              }
            }}
          >
            <Backpack size={15} />
            {showPointsPanel ? "Ocultar distribuicao de pontos" : "Distribuir pontos de classe"}
          </button>

          {showPointsPanel ? (
            <div className={styles.quickCreatePointsPanel}>
              <Link href={`/rpg/${rpgId}/items`} onClick={() => setIsOpen(false)}>
                <Backpack size={15} />
                Itens
              </Link>
              <p className={styles.quickCreatePanelTitle}>
                Players e classes para distribuir {costResourceName}
              </p>
              <label className={styles.quickCreateAmountField}>
                <span>Quantidade</span>
                <input
                  type="number"
                  onWheel={(event) => event.currentTarget.blur()}
                  min={1}
                  step={1}
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  disabled={loadingActionKey.length > 0}
                />
              </label>

              {loadingPanel ? <p>Carregando players...</p> : null}
              {!loadingPanel && !hasPlayers ? <p>Nenhum player encontrado.</p> : null}

              {players.map((player) => {
                const loadingAdd = loadingActionKey === `${player.id}:1`
                const loadingRemove = loadingActionKey === `${player.id}:-1`
                const loadingAny = loadingActionKey.length > 0
                return (
                  <div key={player.id} className={styles.quickCreatePlayerRow}>
                    <div>
                      <strong>{player.name}</strong>
                      <small>Classe: {player.classLabel}</small>
                    </div>
                    <div className={styles.quickCreateGrantActions}>
                      <button
                        type="button"
                        className={styles.quickCreateGrantButton}
                        onClick={() => void handleGrantPoint(player.id, player.name, -1)}
                        disabled={loadingAny || !selectedAmount}
                        aria-label={`Diminuir ponto de ${player.name}`}
                        title={`Diminuir ponto de ${player.name}`}
                      >
                        {loadingRemove ? "..." : <Minus size={14} />}
                      </button>
                      <button
                        type="button"
                        className={styles.quickCreateGrantButton}
                        onClick={() => void handleGrantPoint(player.id, player.name, 1)}
                        disabled={loadingAny || !selectedAmount}
                        aria-label={`Adicionar ponto para ${player.name}`}
                        title={`Adicionar ponto para ${player.name}`}
                      >
                        {loadingAdd ? "..." : <Plus size={14} />}
                      </button>
                    </div>
                  </div>
                )
              })}

              {panelError ? <p className={styles.quickCreateError}>{panelError}</p> : null}
              {panelMessage ? <p className={styles.quickCreateSuccess}>{panelMessage}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
