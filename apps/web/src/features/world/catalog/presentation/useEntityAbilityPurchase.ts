"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { buyEntityCatalogSkillUseCase } from "@/features/world/catalog/application/use-cases/entityCatalogClient"
import { dismissToast } from "@/lib/toast"
import { entityCatalogDependencies } from "@/features/world/catalog/presentation/dependencies"

export function useEntityAbilityPurchase(params: {
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
    if (
      !params.purchase?.characterId ||
      !params.purchase.costsEnabled ||
      loadingKey
    )
      return null

    setLoadingKey(key)
    const loadingToastId = toast.loading("Comprando habilidade...")

    try {
      const result = await buyEntityCatalogSkillUseCase(
        entityCatalogDependencies,
        {
          characterId: params.purchase.characterId,
          skillId,
          level
        }
      )

      if (!result.success) {
        toast.error(result.message)
        return null
      }

      setPoints(result.remainingPoints ?? points)
      toast.success(result.message)
      return {
        remainingPoints: result.remainingPoints ?? points
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
    buySkill
  }
}
