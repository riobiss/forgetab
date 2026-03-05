import type { Dispatch, FormEvent, MutableRefObject, SetStateAction } from "react"
import type { ItemsDashboardDependencies } from "@/application/itemsDashboard/contracts/ItemsDashboardDependencies"
import { deleteItemUseCase, giveItemUseCase } from "@/application/itemsDashboard/use-cases/itemsDashboard"
import type { BaseItem, CharacterSummary } from "./types"

type UseItemsDashboardActionsParams = {
  deps: ItemsDashboardDependencies
  rpgId: string
  characters: CharacterSummary[]
  items: BaseItem[]
  selectedGiveItem: BaseItem | null
  selectedCharacterId: string
  giveQuantity: number
  deletingRef: MutableRefObject<boolean>
  givingRef: MutableRefObject<boolean>
  setItems: Dispatch<SetStateAction<BaseItem[]>>
  setLoadingError: Dispatch<SetStateAction<string>>
  setDeletingItemId: Dispatch<SetStateAction<string | null>>
  setGiveModalItemId: Dispatch<SetStateAction<string | null>>
  setSelectedCharacterId: Dispatch<SetStateAction<string>>
  setGiveQuantity: Dispatch<SetStateAction<number>>
  setGiveError: Dispatch<SetStateAction<string>>
  setGiveSuccess: Dispatch<SetStateAction<string>>
  setGiving: Dispatch<SetStateAction<boolean>>
}

export function useItemsDashboardActions(params: UseItemsDashboardActionsParams) {
  function openGiveModal(itemId: string) {
    params.setGiveModalItemId(itemId)
    params.setSelectedCharacterId(params.characters[0]?.id ?? "")
    params.setGiveQuantity(1)
    params.setGiveError("")
    params.setGiveSuccess("")
  }

  function closeGiveModal() {
    params.setGiveModalItemId(null)
    params.setGiveError("")
    params.setGiveSuccess("")
    params.setGiveQuantity(1)
  }

  async function handleDelete(itemId: string) {
    if (params.deletingRef.current) return
    const confirmed = window.confirm("Tem certeza que deseja deletar este item?")
    if (!confirmed) {
      return
    }

    try {
      params.deletingRef.current = true
      params.setDeletingItemId(itemId)
      params.setLoadingError("")
      await deleteItemUseCase(params.deps, { rpgId: params.rpgId, itemId })

      params.setItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch (cause) {
      params.setLoadingError(cause instanceof Error ? cause.message : "Erro de conexao ao deletar item.")
    } finally {
      params.setDeletingItemId(null)
      params.deletingRef.current = false
    }
  }

  async function handleGiveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (params.givingRef.current) return
    params.givingRef.current = true
    params.setGiving(true)
    params.setGiveError("")
    params.setGiveSuccess("")

    if (!params.selectedGiveItem || !params.selectedCharacterId) {
      params.setGiveError("Selecione um personagem para receber o item.")
      params.setGiving(false)
      params.givingRef.current = false
      return
    }

    try {
      const result = await giveItemUseCase(params.deps, {
        rpgId: params.rpgId,
        payload: {
          baseItemId: params.selectedGiveItem.id,
          quantity: params.giveQuantity,
          characterIds: [params.selectedCharacterId],
        },
      })
      params.setGiveSuccess(result.message)
      setTimeout(() => closeGiveModal(), 700)
    } catch (cause) {
      params.setGiveError(cause instanceof Error ? cause.message : "Erro de conexao ao entregar item.")
    } finally {
      params.setGiving(false)
      params.givingRef.current = false
    }
  }

  return {
    openGiveModal,
    closeGiveModal,
    handleDelete,
    handleGiveItem,
  }
}
