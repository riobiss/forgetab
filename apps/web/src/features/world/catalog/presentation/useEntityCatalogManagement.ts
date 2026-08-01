"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogTemplateRecord } from "@/features/world/catalog/application/types"
import {
  deleteEntityCatalogCategory,
  getEntityCatalogCategoryDrafts,
  updateEntityCatalogCategory,
  type EntityCatalogCategoryItemDraft,
} from "@/features/world/catalog/application/use-cases/manageEntityCatalogCategory"
import { dismissToast } from "@/lib/toast"
import { useEntityCatalogActions } from "@/features/world/catalog/presentation/useEntityCatalogActions"

type Params = {
  rpgId: string
  entityType: CatalogEntityType
  canManage: boolean
}

export function useEntityCatalogManagement(params: Params) {
  const actions = useEntityCatalogActions(params)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createCategory, setCreateCategory] = useState("geral")
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [manageCategoryOpen, setManageCategoryOpen] = useState(false)
  const [manageCategoryName, setManageCategoryName] = useState("")
  const [manageCategoryDraft, setManageCategoryDraft] = useState("")
  const [manageCategoryItems, setManageCategoryItems] = useState<
    EntityCatalogCategoryItemDraft[]
  >([])
  const [manageCategoryCollection, setManageCategoryCollection] = useState<
    EntityCatalogTemplateRecord[]
  >([])
  const [manageCategorySaving, setManageCategorySaving] = useState(false)
  const [manageCategoryError, setManageCategoryError] = useState("")

  function openCreateModal() {
    if (!params.canManage) return

    setCreateError("")
    setCreateName("")
    setCreateCategory("geral")
    setCreateDescription("")
    setCreatingCategory(false)
    setNewCategory("")
    setCreateOpen(true)
  }

  async function createEntry() {
    if (!params.canManage || creating) return
    setCreating(true)
    setCreateError("")
    const loadingToastId = toast.loading(
      `Criando ${params.entityType === "class" ? "classe" : "raca"}...`,
    )

    try {
      const normalizedCategory =
        creatingCategory && newCategory.trim()
          ? newCategory.trim()
          : createCategory.trim() || "geral"

      await actions.createEntry({
        name: createName,
        category: normalizedCategory,
        description: createDescription,
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Erro ao criar."
      setCreateError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setCreating(false)
    }
  }

  async function openCategory(categoryName: string) {
    if (!params.canManage) return

    setManageCategoryError("")
    setManageCategorySaving(false)

    try {
      const collection = await actions.fetchCollection()
      setManageCategoryCollection(collection)
      setManageCategoryName(categoryName)
      setManageCategoryDraft(categoryName)
      setManageCategoryItems(
        getEntityCatalogCategoryDrafts(collection, categoryName),
      )
      setManageCategoryOpen(true)
    } catch (cause) {
      setManageCategoryError(
        cause instanceof Error ? cause.message : "Erro ao carregar categoria.",
      )
      setManageCategoryOpen(true)
    }
  }

  async function saveCategory() {
    if (manageCategorySaving) return

    setManageCategorySaving(true)
    setManageCategoryError("")
    const loadingToastId = toast.loading("Salvando categoria...")

    try {
      const nextCollection = updateEntityCatalogCategory(
        manageCategoryCollection,
        {
          currentCategory: manageCategoryName,
          nextCategory: manageCategoryDraft,
          items: manageCategoryItems,
        },
      )

      await actions.saveCollection(nextCollection)
      setManageCategoryOpen(false)
      toast.success("Categoria salva com sucesso.")
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Erro ao salvar categoria."
      setManageCategoryError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setManageCategorySaving(false)
    }
  }

  async function deleteCategory() {
    if (manageCategorySaving) return

    setManageCategorySaving(true)
    setManageCategoryError("")
    const loadingToastId = toast.loading("Deletando categoria...")

    try {
      await actions.saveCollection(
        deleteEntityCatalogCategory(
          manageCategoryCollection,
          manageCategoryName,
        ),
      )
      setManageCategoryOpen(false)
      toast.success("Categoria deletada com sucesso.")
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Erro ao deletar categoria."
      setManageCategoryError(message)
      toast.error(message)
    } finally {
      dismissToast(loadingToastId)
      setManageCategorySaving(false)
    }
  }

  return {
    create: {
      open: createOpen,
      setOpen: setCreateOpen,
      name: createName,
      setName: setCreateName,
      category: createCategory,
      setCategory: setCreateCategory,
      creatingCategory,
      setCreatingCategory,
      newCategory,
      setNewCategory,
      description: createDescription,
      setDescription: setCreateDescription,
      submitting: creating,
      error: createError,
      openModal: openCreateModal,
      submit: createEntry,
    },
    category: {
      open: manageCategoryOpen,
      setOpen: setManageCategoryOpen,
      name: manageCategoryName,
      draft: manageCategoryDraft,
      setDraft: setManageCategoryDraft,
      items: manageCategoryItems,
      setItems: setManageCategoryItems,
      submitting: manageCategorySaving,
      error: manageCategoryError,
      openModal: openCategory,
      save: saveCategory,
      delete: deleteCategory,
    },
  }
}

export type EntityCatalogManagement = ReturnType<
  typeof useEntityCatalogManagement
>
