"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import type { EntityCatalogDependencies } from "@/application/entityCatalog/contracts/EntityCatalogDependencies"
import { buyEntityCatalogSkillUseCase } from "@/application/entityCatalog/use-cases/entityCatalogClient"
import { dismissToast } from "@/lib/toast"

export function useEntityAbilityPurchase(params: {
  deps: EntityCatalogDependencies
  purchase?: {
    characterId: string | null
    costsEnabled: boolean
    costResourceName: string
    initialPoints: number
    initialOwnedBySkill: Record<string, number[]>
  }
}) {
  const [points, setPoints] = useState(params.purchase?.initialPoints ?? 0)
  const [loadingKey, setLoadingKey] = useState("")

  async function buySkill(skillId: string, level: number, key: string) {
    if (!params.purchase?.characterId || !params.purchase.costsEnabled || loadingKey) return null

    setLoadingKey(key)
    const loadingToastId = toast.loading("Comprando habilidade...")

    try {
      const result = await buyEntityCatalogSkillUseCase(params.deps, {
        characterId: params.purchase.characterId,
        skillId,
        level,
      })

      if (!result.success) {
        toast.error(result.message)
        return null
      }

      setPoints(result.remainingPoints ?? points)
      toast.success(result.message)
      return {
        remainingPoints: result.remainingPoints ?? points,
      }
    } catch {
      toast.error("Erro de conexao ao comprar habilidade.")
      return null
    } finally {
      dismissToast(loadingToastId)
      setLoadingKey("")
    }
  }

  return {
    points,
    loadingKey,
    buySkill,
  }
}
