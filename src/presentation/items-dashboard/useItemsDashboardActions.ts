import type { Dispatch, FormEvent, MutableRefObject, SetStateAction } from "react"
import type { ApiGivePayload, BaseItem, CharacterSummary } from "./types"

type UseItemsDashboardActionsParams = {
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

      const response = await fetch(`/api/rpg/${params.rpgId}/items/${itemId}`, {
        method: "DELETE",
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        params.setLoadingError(payload.message ?? "Nao foi possivel deletar o item.")
        return
      }

      params.setItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch {
      params.setLoadingError("Erro de conexao ao deletar item.")
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
      const response = await fetch(`/api/rpg/${params.rpgId}/items/give`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseItemId: params.selectedGiveItem.id,
          quantity: params.giveQuantity,
          characterIds: [params.selectedCharacterId],
        }),
      })

      const payload = (await response.json()) as ApiGivePayload

      if (!response.ok) {
        params.setGiveError(payload.message ?? "Nao foi possivel entregar o item.")
        return
      }

      params.setGiveSuccess(payload.message ?? "Item entregue com sucesso.")
      setTimeout(() => closeGiveModal(), 700)
    } catch {
      params.setGiveError("Erro de conexao ao entregar item.")
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
