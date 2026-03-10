"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { RpgDashboardDependencies } from "@/presentation/rpg-dashboard/dependencies"
import {
  expelMemberUseCase,
  grantPointsUseCase,
  grantXpUseCase,
  loadDashboardDistributionUseCase,
  mapPlayersWithClasses,
  toggleModeratorUseCase,
} from "@/application/rpgDashboard/use-cases/rpgDashboardActions"

export function useMembersList(deps: RpgDashboardDependencies, params: { rpgId: string }) {
  const router = useRouter()
  const [expellingId, setExpellingId] = useState<string | null>(null)
  const [togglingModeratorId, setTogglingModeratorId] = useState<string | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [actionMode, setActionMode] = useState<"none" | "points" | "xp">("none")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [costResourceName, setCostResourceName] = useState("Skill Points")
  const [amountInput, setAmountInput] = useState("1")
  const [playerByUserId, setPlayerByUserId] = useState<Record<string, { characterId: string; classLabel: string }>>({})
  const [loadingActionKey, setLoadingActionKey] = useState("")

  const selectedAmount = useMemo(() => {
    const parsed = Number(amountInput)
    if (!Number.isInteger(parsed) || parsed <= 0) return null
    return parsed
  }, [amountInput])

  async function expelMember(memberId: string) {
    if (expellingId) return false
    setExpellingId(memberId)
    try {
      await expelMemberUseCase(deps.gateway, { rpgId: params.rpgId, memberId })
      router.refresh()
      return true
    } catch {
      return false
    } finally {
      setExpellingId(null)
    }
  }

  async function toggleModerator(memberId: string) {
    if (togglingModeratorId || expellingId) return false
    setTogglingModeratorId(memberId)
    try {
      await toggleModeratorUseCase(deps.gateway, { rpgId: params.rpgId, memberId })
      router.refresh()
      return true
    } catch {
      return false
    } finally {
      setTogglingModeratorId(null)
    }
  }

  async function loadActionData() {
    setActionLoading(true)
    setActionError("")
    setActionMessage("")
    try {
      const { charactersPayload, classesPayload, rpgPayload } = await loadDashboardDistributionUseCase(
        deps.gateway,
        { rpgId: params.rpgId },
      )

      const players = mapPlayersWithClasses({
        characters: charactersPayload.characters ?? [],
        classes: classesPayload.classes ?? [],
      })

      setPlayerByUserId(
        players.reduce<Record<string, { characterId: string; classLabel: string }>>((acc, item) => {
          if (!item.userId) return acc
          acc[item.userId] = { characterId: item.id, classLabel: item.classLabel }
          return acc
        }, {}),
      )
      setCostResourceName(rpgPayload.rpg?.costResourceName?.trim() || "Skill Points")
      setAmountInput("1")
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Erro de conexao ao carregar dados de distribuicao.",
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function handleGrantPoints(member: { id: string; userId: string; userName: string }, direction: 1 | -1) {
    if (!selectedAmount) {
      setActionError("Informe uma quantidade valida (inteiro maior que zero).")
      return
    }

    const player = playerByUserId[member.userId]
    if (!player) {
      setActionError(`${member.userName} nao possui personagem player vinculado.`)
      return
    }

    setLoadingActionKey(`${member.id}:${direction}`)
    setActionError("")
    setActionMessage("")

    try {
      const payload = await grantPointsUseCase(deps.gateway, {
        characterId: player.characterId,
        amount: selectedAmount * direction,
      })
      const remaining =
        typeof payload.remainingPoints === "number" ? ` (${payload.remainingPoints})` : ""
      setActionMessage(
        direction > 0
          ? `${member.userName} recebeu ${selectedAmount} ${costResourceName}.${remaining}`
          : `${member.userName} perdeu ${selectedAmount} ${costResourceName}.${remaining}`,
      )
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Erro de conexao ao atualizar pontos.")
    } finally {
      setLoadingActionKey("")
    }
  }

  async function handleGrantXp(member: { id: string; userId: string; userName: string }) {
    if (!selectedAmount) {
      setActionError("Informe uma quantidade valida (inteiro maior que zero).")
      return
    }

    const player = playerByUserId[member.userId]
    if (!player) {
      setActionError(`${member.userName} nao possui personagem player vinculado.`)
      return
    }

    setLoadingActionKey(`${member.id}:xp`)
    setActionError("")
    setActionMessage("")

    try {
      const payload = await grantXpUseCase(deps.gateway, {
        characterId: player.characterId,
        amount: selectedAmount,
      })
      const progressionLabel = payload.progressionLabel ?? "Etapa"
      const progressionCurrent = payload.progressionCurrent ?? 0
      const progressionRequired = payload.progressionRequired ?? 0
      setActionMessage(
        `${member.userName} recebeu ${selectedAmount} XP. Agora esta em ${progressionLabel} (${progressionCurrent}/${progressionRequired}).`,
      )
      router.refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Erro de conexao ao conceder XP.")
    } finally {
      setLoadingActionKey("")
    }
  }

  return {
    expellingId,
    togglingModeratorId,
    actionsOpen,
    setActionsOpen,
    actionMode,
    setActionMode,
    actionLoading,
    actionError,
    actionMessage,
    costResourceName,
    amountInput,
    setAmountInput,
    playerByUserId,
    loadingActionKey,
    selectedAmount,
    expelMember,
    toggleModerator,
    loadActionData,
    handleGrantPoints,
    handleGrantXp,
  }
}
