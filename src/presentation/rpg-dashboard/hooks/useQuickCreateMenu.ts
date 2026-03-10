"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { RpgDashboardDependencies } from "@/presentation/rpg-dashboard/dependencies"
import {
  grantPointsUseCase,
  loadDashboardDistributionUseCase,
  mapPlayersWithClasses,
} from "@/application/rpgDashboard/use-cases/rpgDashboardActions"

export function useQuickCreateMenu(deps: RpgDashboardDependencies, params: { rpgId: string }) {
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
    if (!Number.isInteger(parsed) || parsed <= 0) return null
    return parsed
  }, [amountInput])

  const loadPointsPanelData = useCallback(async () => {
    if (loadingPanelRef.current) return
    loadingPanelRef.current = true

    try {
      setLoadingPanel(true)
      setPanelError("")
      setPanelMessage("")

      const { charactersPayload, classesPayload, rpgPayload } = await loadDashboardDistributionUseCase(
        deps.gateway,
        { rpgId: params.rpgId },
      )

      const playerRows = mapPlayersWithClasses({
        characters: charactersPayload.characters ?? [],
        classes: classesPayload.classes ?? [],
      }).map((item) => ({
        id: item.id,
        name: item.name,
        classLabel: item.classLabel,
      }))

      setPlayers(playerRows)
      setCostResourceName(rpgPayload.rpg?.costResourceName?.trim() || "Skill Points")
      setAmountInput("1")
    } catch (error) {
      setPanelError(
        error instanceof Error ? error.message : "Erro de conexao ao carregar distribuicao de pontos.",
      )
    } finally {
      setLoadingPanel(false)
      loadingPanelRef.current = false
    }
  }, [deps.gateway, params.rpgId])

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

      const payload = await grantPointsUseCase(deps.gateway, {
        characterId,
        amount: selectedAmount * amount,
      })

      const remainingPoints =
        typeof payload.remainingPoints === "number" ? ` (${payload.remainingPoints})` : ""
      if (amount > 0) {
        setPanelMessage(`${playerName} recebeu ${selectedAmount} ${costResourceName}.${remainingPoints}`)
      } else {
        setPanelMessage(`${playerName} perdeu ${selectedAmount} ${costResourceName}.${remainingPoints}`)
      }
    } catch (error) {
      setPanelError(
        error instanceof Error ? error.message : "Erro de conexao ao atualizar ponto de classe.",
      )
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
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  return {
    isOpen,
    setIsOpen,
    showPointsPanel,
    setShowPointsPanel,
    loadingPanel,
    panelError,
    panelMessage,
    costResourceName,
    amountInput,
    setAmountInput,
    players,
    loadingActionKey,
    hasPlayers,
    selectedAmount,
    wrapperRef,
    loadPointsPanelData,
    handleGrantPoint,
  }
}
