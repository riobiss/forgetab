import type { Dispatch, FormEvent, MutableRefObject, SetStateAction } from "react"
import { toast } from "react-hot-toast"
import type { ItemsDashboardDependencies } from "@/application/itemsDashboard/contracts/ItemsDashboardDependencies"
import {
  createItemUseCase,
  deleteItemImageByUrlUseCase,
  deleteItemUseCase,
  giveItemUseCase,
  updateItemUseCase,
  uploadItemImageUseCase,
} from "@/application/itemsDashboard/use-cases/itemsDashboard"
import type { UpsertItemPayloadDto } from "@/application/itemsEditor/types"
import { dismissToast } from "@/lib/toast"
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
  savingRef: MutableRefObject<boolean>
  editorMode: "create" | "edit"
  editingItemId: string | null
  selectedImageFile: File | null
  pendingImageRemoval: boolean
  buildPayload: () => UpsertItemPayloadDto
  setItems: Dispatch<SetStateAction<BaseItem[]>>
  setLoadingError: Dispatch<SetStateAction<string>>
  setDeletingItemId: Dispatch<SetStateAction<string | null>>
  setGiveModalItemId: Dispatch<SetStateAction<string | null>>
  setSelectedCharacterId: Dispatch<SetStateAction<string>>
  setGiveQuantity: Dispatch<SetStateAction<number>>
  setGiveError: Dispatch<SetStateAction<string>>
  setGiveSuccess: Dispatch<SetStateAction<string>>
  setGiving: Dispatch<SetStateAction<boolean>>
  setEditorSaving: Dispatch<SetStateAction<boolean>>
  setEditorError: Dispatch<SetStateAction<string>>
  setUploadError: Dispatch<SetStateAction<string>>
  setUploadingImage: Dispatch<SetStateAction<boolean>>
  closeEditorModal: () => void
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

  async function handleSaveItem() {
    if (params.savingRef.current) return
    params.savingRef.current = true
    params.setEditorSaving(true)
    params.setEditorError("")
    params.setUploadError("")
    const isEditing = params.editorMode === "edit"
    const loadingToastId = toast.loading(isEditing ? "Salvando item..." : "Criando item...")
    let uploadedImageUrl = ""
    let hasFreshUpload = false

    try {
      const payload = params.buildPayload()

      if (params.selectedImageFile) {
        params.setUploadingImage(true)
        try {
          const upload = await uploadItemImageUseCase(params.deps, { file: params.selectedImageFile })
          uploadedImageUrl = upload.url
          hasFreshUpload = true
          payload.image = uploadedImageUrl
        } finally {
          params.setUploadingImage(false)
        }
      }

      const savedItem =
        isEditing && params.editingItemId
          ? await updateItemUseCase(params.deps, {
              rpgId: params.rpgId,
              itemId: params.editingItemId,
              payload,
            })
          : await createItemUseCase(params.deps, { rpgId: params.rpgId, payload })

      params.setItems((prev) => {
        const nextItem = savedItem as unknown as BaseItem
        if (isEditing) {
          return prev.map((item) => (item.id === nextItem.id ? nextItem : item))
        }

        return [nextItem, ...prev]
      })

      toast.success(isEditing ? "Item salvo com sucesso." : "Item criado com sucesso.")
      params.closeEditorModal()
    } catch (cause) {
      if (hasFreshUpload && uploadedImageUrl) {
        try {
          await deleteItemImageByUrlUseCase(params.deps, { url: uploadedImageUrl })
        } catch {
          // Nao bloqueia a resposta de erro se a limpeza da imagem falhar.
        }
      }

      const message = cause instanceof Error ? cause.message : "Erro de conexao ao salvar o item."
      params.setEditorError(message)
      params.setUploadError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      params.setEditorSaving(false)
      params.savingRef.current = false
    }
  }

  return {
    openGiveModal,
    closeGiveModal,
    handleDelete,
    handleGiveItem,
    handleSaveItem,
  }
}
