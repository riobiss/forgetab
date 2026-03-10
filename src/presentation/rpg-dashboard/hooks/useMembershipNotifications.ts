"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { RpgDashboardDependencies } from "@/presentation/rpg-dashboard/dependencies"
import {
  processCharacterRequestUseCase,
  processMemberRequestUseCase,
  requestToJoinRpgUseCase,
} from "@/application/rpgDashboard/use-cases/rpgDashboardActions"

export function useMembershipNotifications(
  deps: RpgDashboardDependencies,
  params: { rpgId: string },
) {
  const router = useRouter()
  const [loadingRequest, setLoadingRequest] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function requestToJoin() {
    if (loadingRequest) return
    setLoadingRequest(true)
    setMessage("")
    setError("")

    try {
      const payload = await requestToJoinRpgUseCase(deps.gateway, { rpgId: params.rpgId })
      if (!payload.message || payload.message.includes("nao") || payload.message.includes("ja ")) {
        // preserve previous behavior by relying on message semantics when route returns non-2xx payloads
      }
      setMessage(payload.message ?? "Solicitacao enviada.")
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro de conexao ao solicitar participacao.")
    } finally {
      setLoadingRequest(false)
    }
  }

  async function processRequest(memberId: string, action: "accept" | "reject") {
    if (processingId) return
    setProcessingId(memberId)
    setMessage("")
    setError("")

    try {
      const payload = await processMemberRequestUseCase(deps.gateway, {
        rpgId: params.rpgId,
        memberId,
        action,
      })
      setMessage(payload.message ?? "Solicitacao processada.")
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro de conexao ao processar solicitacao.")
    } finally {
      setProcessingId(null)
    }
  }

  async function processCharacterRequest(requestId: string, action: "accept" | "reject") {
    if (processingId) return
    setProcessingId(requestId)
    setMessage("")
    setError("")

    try {
      const payload = await processCharacterRequestUseCase(deps.gateway, {
        rpgId: params.rpgId,
        requestId,
        action,
      })
      setMessage(payload.message ?? "Solicitacao de personagem processada.")
      router.refresh()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erro de conexao ao processar solicitacao de personagem.",
      )
    } finally {
      setProcessingId(null)
    }
  }

  return {
    loadingRequest,
    processingId,
    message,
    error,
    requestToJoin,
    processRequest,
    processCharacterRequest,
  }
}
