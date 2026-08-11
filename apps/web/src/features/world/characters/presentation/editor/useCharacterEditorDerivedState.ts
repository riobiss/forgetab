import { useMemo } from "react"
import type {
  CharacterEditorBootstrapDto,
  CharacterIdentityFieldDto
} from "@/features/world/characters/application/editor"
import {
  resolveProgressionTierByCurrent,
  type ProgressionMode,
  type ProgressionTier
} from "@forgetab/world-contracts/rpg/progression"
import { isIdentityNameField } from "./utils"

export type PlayerSelectOption = {
  value: string
  label: string
}

type Params = {
  assignablePlayers: CharacterEditorBootstrapDto["assignablePlayers"]
  offerToUserId: string
  identityTemplates: CharacterIdentityFieldDto[]
  image: string
  selectedImageName: string
  progressionCurrent: string
  progressionMode: ProgressionMode
  progressionTiers: ProgressionTier[]
}

export function useCharacterEditorDerivedState({
  assignablePlayers,
  offerToUserId,
  identityTemplates,
  image,
  selectedImageName,
  progressionCurrent,
  progressionMode,
  progressionTiers
}: Params) {
  const assignablePlayerOptions = useMemo(
    () =>
      assignablePlayers.map((player) => ({
        value: player.userId,
        label: `${player.name} (@${player.username})`
      })),
    [assignablePlayers]
  )
  const selectedOfferPlayer =
    assignablePlayerOptions.find(({ value }) => value === offerToUserId) ?? null
  const identityNameField =
    identityTemplates.find(isIdentityNameField) ?? null
  const imageStatusText = useMemo(() => {
    if (selectedImageName.trim()) return selectedImageName
    if (!image.trim()) return ""
    const lastPathSegment = image.split("/").pop() ?? ""
    return lastPathSegment
      ? decodeURIComponent(lastPathSegment)
      : "Imagem atual selecionada"
  }, [image, selectedImageName])
  const normalizedProgressionCurrent = useMemo(() => {
    const parsed = Number(progressionCurrent || 0)
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
  }, [progressionCurrent])
  const resolvedProgressionTier = useMemo(
    () =>
      resolveProgressionTierByCurrent(
        progressionMode,
        progressionTiers,
        normalizedProgressionCurrent
      ),
    [normalizedProgressionCurrent, progressionMode, progressionTiers]
  )

  return {
    assignablePlayerOptions,
    selectedOfferPlayer,
    identityNameField,
    imageStatusText,
    resolvedProgressionTier
  }
}
