"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import type { RpgMapMarkerGroupDto } from "@forgetab/world-contracts/location"
import { deleteRpgMapMarkerGroupUseCase } from "@/features/world/location/application/use-cases/rpgMapMarkerGroups.client"
import { savePublicMarkerGroupUseCase } from "@/features/world/location/application/use-cases/savePublicMarkerGroup"
import {
  createPrivateMarkerGroup,
  removeMarkerGroup,
} from "@/features/world/location/application/services/markerGroupMutations"
import { fromPublicMarkerGroupDto } from "@/features/world/location/application/services/markerGroupSerialization"
import { rpgMapPresentationDeps } from "@/features/world/location/presentation/dependencies"
import type {
  MarkerGroup,
  PendingMarker,
} from "@/features/world/location/presentation/types/mapMarkers"

type Params = {
  rpgId: string
  mapId: string
  markerColors: string[]
  initialPublicMarkerGroups: RpgMapMarkerGroupDto[]
}

export function useMapMarkerGroupStore(params: Params) {
  const [privateMarkerGroups, setPrivateMarkerGroups] = useState<MarkerGroup[]>(
    [],
  )
  const [publicMarkerGroups, setPublicMarkerGroups] = useState<MarkerGroup[]>(
    [],
  )
  const [hasLoadedPrivateMarkerGroups, setHasLoadedPrivateMarkerGroups] =
    useState(false)
  const [isMarkerGroupOperationPending, setIsMarkerGroupOperationPending] =
    useState(false)
  const markerGroupOperationRef = useRef(false)

  const allMarkerGroups = useMemo(
    () => [...publicMarkerGroups, ...privateMarkerGroups],
    [privateMarkerGroups, publicMarkerGroups],
  )

  useEffect(() => {
    setHasLoadedPrivateMarkerGroups(false)

    try {
      setPrivateMarkerGroups(
        rpgMapPresentationDeps.privateMarkerGroupStorage.load(
          params.mapId,
          params.markerColors,
        ),
      )
    } catch {
      setPrivateMarkerGroups([])
    } finally {
      setHasLoadedPrivateMarkerGroups(true)
    }
  }, [params.mapId, params.markerColors])

  useEffect(() => {
    if (!hasLoadedPrivateMarkerGroups) {
      return
    }

    rpgMapPresentationDeps.privateMarkerGroupStorage.save(
      params.mapId,
      privateMarkerGroups,
    )
  }, [hasLoadedPrivateMarkerGroups, params.mapId, privateMarkerGroups])

  useEffect(() => {
    return rpgMapPresentationDeps.privateMarkerGroupStorage.subscribe(
      params.mapId,
      () => {
        try {
          const loadedGroups =
            rpgMapPresentationDeps.privateMarkerGroupStorage.load(
              params.mapId,
              params.markerColors,
            )
          setPrivateMarkerGroups((current) =>
            JSON.stringify(current) === JSON.stringify(loadedGroups)
              ? current
              : loadedGroups,
          )
        } catch {
          setPrivateMarkerGroups([])
        } finally {
          setHasLoadedPrivateMarkerGroups(true)
        }
      },
    )
  }, [params.mapId, params.markerColors])

  useEffect(() => {
    setPublicMarkerGroups(
      params.initialPublicMarkerGroups.map(fromPublicMarkerGroupDto),
    )
  }, [params.initialPublicMarkerGroups])

  async function persistPublicMarkerGroup(group: MarkerGroup) {
    if (markerGroupOperationRef.current) return null
    markerGroupOperationRef.current = true
    setIsMarkerGroupOperationPending(true)
    try {
      const normalizedGroup = await savePublicMarkerGroupUseCase(
        rpgMapPresentationDeps.rpgMapGateway,
        {
          rpgId: params.rpgId,
          mapId: params.mapId,
          group,
        },
      )

      setPublicMarkerGroups((current) => {
        const withoutCurrent = current.filter(
          (item) => item.id !== normalizedGroup.id,
        )
        return [...withoutCurrent, normalizedGroup]
      })

      if (group.visibility === "private") {
        setPrivateMarkerGroups((current) =>
          removeMarkerGroup(current, group.id),
        )
      }

      toast.success(
        group.visibility === "private"
          ? "Grupo publicado com sucesso."
          : "Grupo atualizado com sucesso.",
      )
      return normalizedGroup
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao salvar grupo publico.",
      )
      return null
    } finally {
      markerGroupOperationRef.current = false
      setIsMarkerGroupOperationPending(false)
    }
  }

  async function deletePublicMarkerGroup(groupId: string) {
    if (markerGroupOperationRef.current) return false
    markerGroupOperationRef.current = true
    setIsMarkerGroupOperationPending(true)
    try {
      await deleteRpgMapMarkerGroupUseCase(
        rpgMapPresentationDeps.rpgMapGateway,
        {
          rpgId: params.rpgId,
          mapId: params.mapId,
          groupId,
        },
      )
      setPublicMarkerGroups((current) => removeMarkerGroup(current, groupId))
      toast.success("Grupo de marcadores removido com sucesso.")
      return true
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao remover grupo publico.",
      )
      return false
    } finally {
      markerGroupOperationRef.current = false
      setIsMarkerGroupOperationPending(false)
    }
  }

  function createPrivateGroup(input: {
    markerGroupName: string
    markerGroupColor: string
    pendingMarkers: PendingMarker[]
  }) {
    const nextGroup = createPrivateMarkerGroup({
      id: crypto.randomUUID(),
      name: input.markerGroupName,
      color: input.markerGroupColor,
      pendingMarkers: input.pendingMarkers,
    })
    if (!nextGroup) return null

    setPrivateMarkerGroups((current) => [...current, nextGroup])
    return nextGroup
  }

  function updatePrivateGroups(
    updater: (groups: MarkerGroup[]) => MarkerGroup[],
  ) {
    setPrivateMarkerGroups((current) => updater(current))
  }

  return {
    allMarkerGroups,
    privateMarkerGroups,
    publicMarkerGroups,
    isMarkerGroupOperationPending,
    setPrivateMarkerGroups,
    setPublicMarkerGroups,
    createPrivateGroup,
    updatePrivateGroups,
    persistPublicMarkerGroup,
    deletePublicMarkerGroup,
  }
}
