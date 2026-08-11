"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from "react"
import { toast } from "react-hot-toast"
import type {
  RpgMapDetailViewDto,
  RpgMapDto
} from "@forgetab/world-contracts/location"
import {
  createRpgMapUseCase,
  deleteRpgMapUseCase,
  loadRpgMapDetailUseCase,
  loadRpgMapsUseCase,
  updateRpgMapUseCase
} from "@/features/world/location/application/use-cases/rpgMaps.client"
import { rpgMapPresentationDeps } from "@/features/world/location/presentation/dependencies"
import { useRpgMapFormModalState } from "./useRpgMapFormModalState"
import { matchesSearch } from "@forgetab/world-contracts/shared/search"

type UseRpgMapsCatalogParams = {
  rpgId: string
  view: "catalog" | "detail"
  initialMapId: string | null
  setSelectedSectionId: Dispatch<SetStateAction<string | null>>
}

export function useRpgMapsCatalog({
  rpgId,
  view,
  initialMapId,
  setSelectedSectionId
}: UseRpgMapsCatalogParams) {
  const mapModalRef = useRef<HTMLElement | null>(null)
  const [maps, setMaps] = useState<RpgMapDto[]>([])
  const [selectedMapId, setSelectedMapId] = useState<string | null>(
    initialMapId
  )
  const [detail, setDetail] = useState<RpgMapDetailViewDto | null>(null)
  const [loadingMaps, setLoadingMaps] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const modalState = useRpgMapFormModalState()

  const filteredMaps = useMemo(() => {
    return maps.filter((map) =>
      matchesSearch([map.title, map.description, map.type], search)
    )
  }, [maps, search])

  const loadMaps = useCallback(async () => {
    try {
      setLoadingMaps(true)
      setError("")
      const payload = await loadRpgMapsUseCase(
        rpgMapPresentationDeps.rpgMapGateway,
        { rpgId }
      )
      setMaps(payload.maps)
      setSelectedMapId((current) => {
        if (view === "detail") {
          return initialMapId ?? current ?? null
        }
        return current ?? payload.maps[0]?.id ?? null
      })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Erro ao carregar mapas."
      )
    } finally {
      setLoadingMaps(false)
    }
  }, [initialMapId, rpgId, view])

  const loadDetail = useCallback(
    async (mapId: string, preferredSectionId?: string | null) => {
      try {
        setLoadingDetail(true)
        setError("")
        const payload = await loadRpgMapDetailUseCase(
          rpgMapPresentationDeps.rpgMapGateway,
          { rpgId, mapId }
        )
        setDetail(payload)
        setSelectedSectionId((current) => {
          const nextId = preferredSectionId ?? current
          return payload.sections.some((section) => section.id === nextId)
            ? (nextId ?? null)
            : (payload.sections[0]?.id ?? null)
        })
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Erro ao carregar estrutura do mapa."
        )
        setDetail(null)
      } finally {
        setLoadingDetail(false)
      }
    },
    [rpgId, setSelectedSectionId]
  )

  useEffect(() => {
    void loadMaps()
  }, [loadMaps])

  useEffect(() => {
    if (view === "detail" && initialMapId) {
      setSelectedMapId(initialMapId)
    }
  }, [initialMapId, view])

  useEffect(() => {
    if (selectedMapId) {
      void loadDetail(selectedMapId)
      return
    }

    setDetail(null)
    setSelectedSectionId(null)
  }, [loadDetail, selectedMapId, setSelectedSectionId])

  async function saveMap() {
    try {
      setSaving(true)
      modalState.setMapFormError("")
      const payload = {
        title: modalState.mapForm.title.trim(),
        description: modalState.mapForm.description.trim() || null,
        type: modalState.mapForm.type.trim() || null,
        image: modalState.editingMap?.image ?? null
      }
      const map = modalState.editingMap
        ? await updateRpgMapUseCase(rpgMapPresentationDeps.rpgMapGateway, {
            rpgId,
            mapId: modalState.editingMap.id,
            payload
          })
        : await createRpgMapUseCase(rpgMapPresentationDeps.rpgMapGateway, {
            rpgId,
            payload
          })

      await loadMaps()
      setSelectedMapId(map.id)
      modalState.closeMapModal()
      toast.success(
        modalState.editingMap
          ? "Mapa atualizado com sucesso."
          : "Mapa criado com sucesso."
      )
      return true
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Erro ao salvar mapa."
      modalState.setMapFormError(message)
      toast.error(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function deleteMap(map: RpgMapDto) {
    if (
      !window.confirm(`Tem certeza que deseja apagar o mapa "${map.title}"?`)
    ) {
      return false
    }

    try {
      await deleteRpgMapUseCase(rpgMapPresentationDeps.rpgMapGateway, {
        rpgId,
        mapId: map.id
      })
      const nextMaps = maps.filter((item) => item.id !== map.id)
      setMaps(nextMaps)
      setSelectedMapId((current) =>
        current === map.id ? (nextMaps[0]?.id ?? null) : current
      )
      toast.success("Mapa removido com sucesso.")
      return true
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Erro ao remover mapa."
      )
      return false
    }
  }

  return {
    ...modalState,
    deleteMap,
    detail,
    error,
    filteredMaps,
    loadDetail,
    loadMaps,
    loadingDetail,
    loadingMaps,
    mapModalRef,
    maps,
    saveMap,
    saving,
    search,
    selectedMapId,
    setSearch,
    setSelectedMapId
  }
}
