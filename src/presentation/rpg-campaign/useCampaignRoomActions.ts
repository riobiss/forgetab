"use client"

import { useState, type Dispatch, type SetStateAction } from "react"
import type { CharacterInventoryItemDto } from "@/application/characterInventory/types"
import type { PurchasedAbilityViewDto } from "@/application/characterAbilities/types"
import type { BaseItemDto } from "@/application/itemsDashboard/types"
import type { RpgMapDetailViewDto } from "@/application/rpgMap/types"
import type { DashboardCharacterSummary } from "@/application/rpgDashboard/contracts/RpgDashboardGateway"
import type { RpgCampaignRoomViewModel } from "@/application/rpgCampaign/types"
import type { SkillListItemDto } from "@/application/skillsDashboard/types"
import { fetchCharacterAbilitiesViewModel } from "@/infrastructure/characterAbilities/repositories/httpCharacterAbilitiesPageRepository"
import { httpCharacterInventoryGateway } from "@/infrastructure/characterInventory/gateways/httpCharacterInventoryGateway"
import { httpItemsDashboardGateway } from "@/infrastructure/itemsDashboard/gateways/httpItemsDashboardGateway"
import { httpRpgDashboardGateway } from "@/infrastructure/rpgDashboard/gateways/httpRpgDashboardGateway"
import type { CampaignSelectedCharacter } from "@/infrastructure/rpgCampaign/campaignPresence"
import { httpRpgCampaignRepository } from "@/infrastructure/rpgCampaign/repositories/httpRpgCampaignRepository"
import { httpRpgMapGateway } from "@/infrastructure/rpgMap/gateways/httpRpgMapGateway"
import { httpSkillsDashboardGateway } from "@/infrastructure/skillsDashboard/gateways/httpSkillsDashboardGateway"
import {
  SECTION_LINK_IMAGE,
  getLinkedMarkerId,
  getSectionImages,
} from "@/presentation/rpg-map/utils/sectionMarkerLinking"
import {
  buildDeliveryOfferActionContent,
  buildDiceRollActionContent,
  buildItemUseActionContent,
  buildLocationActionContent,
  buildSkillUseActionContent,
  type DeliveryOfferActionPayload,
  type DeliveryOfferAsset,
  type DiceRollActionPayload,
  type DiceRollGroup,
  type DiceRollPreviewGroup,
  findDiceEntriesInValue,
  type ItemUseActionPayload,
  type LocationActionPayload,
  type SkillUseActionPayload,
} from "./actionMessages"

type CampaignRoomMessage = RpgCampaignRoomViewModel["campaignMessages"][number]

function getCustomFieldText(value: unknown) {
  if (typeof value === "string") {
    return value.trim()
  }

  if (!value || Array.isArray(value) || typeof value !== "object") {
    return ""
  }

  const fieldValue = (value as { value?: unknown }).value
  return typeof fieldValue === "string" ? fieldValue.trim() : ""
}

export type CampaignLocationOption = {
  id: string
  sourceKind: "map" | "section" | "marker"
  mapId: string
  mapTitle: string
  title: string
  location: string | null
  description: string | null
  image: string | null
  markerId: string | null
}

type Params = {
  rpgId: string
  room: RpgCampaignRoomViewModel
  activeCombatRoomId: string | null
  selectedCharacter: CampaignSelectedCharacter | null
  setError: (message: string | null) => void
  runAction: (action: () => Promise<{ message?: string }>) => Promise<boolean>
  appendMessageLocally: (message: CampaignRoomMessage) => void
  setRoom: Dispatch<SetStateAction<RpgCampaignRoomViewModel>>
}

export function useCampaignRoomActions({
  rpgId,
  room,
  activeCombatRoomId,
  selectedCharacter,
  setError,
  runAction,
  appendMessageLocally,
  setRoom,
}: Params) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false)
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isStealthMode, setIsStealthMode] = useState(false)
  const [diceEntries, setDiceEntries] = useState<Array<{ diceCount: string; diceSides: string }>>([
    { diceCount: "1", diceSides: "20" },
  ])
  const [dicePreviewGroups, setDicePreviewGroups] = useState<DiceRollPreviewGroup[] | null>(null)
  const [characterAbilities, setCharacterAbilities] = useState<PurchasedAbilityViewDto[]>([])
  const [characterItems, setCharacterItems] = useState<CharacterInventoryItemDto[]>([])
  const [deliveryCharacters, setDeliveryCharacters] = useState<DashboardCharacterSummary[]>([])
  const [deliveryItems, setDeliveryItems] = useState<BaseItemDto[]>([])
  const [deliverySkills, setDeliverySkills] = useState<SkillListItemDto[]>([])
  const [locationOptions, setLocationOptions] = useState<CampaignLocationOption[]>([])
  const [isLoadingDeliveryOptions, setIsLoadingDeliveryOptions] = useState(false)
  const [isLoadingLocationOptions, setIsLoadingLocationOptions] = useState(false)
  const [isUploadingLocationImage, setIsUploadingLocationImage] = useState(false)
  const [isLoadingCharacterAbilities, setIsLoadingCharacterAbilities] = useState(false)
  const [isLoadingCharacterItems, setIsLoadingCharacterItems] = useState(false)
  const [selectedAbilityDetails, setSelectedAbilityDetails] = useState<PurchasedAbilityViewDto | null>(null)
  const [selectedAbilityDetailsMode, setSelectedAbilityDetailsMode] = useState<"view" | "use">("view")
  const [selectedItemDetails, setSelectedItemDetails] = useState<CharacterInventoryItemDto | null>(null)
  const [selectedItemDetailsMode, setSelectedItemDetailsMode] = useState<"view" | "use">("view")
  const [expandedActionIds, setExpandedActionIds] = useState<Record<string, boolean>>({})
  const [expandedRollIds, setExpandedRollIds] = useState<Record<string, boolean>>({})
  const [revokeActionMessageId, setRevokeActionMessageId] = useState<string | null>(null)

  function closeDiceModal() {
    setIsDiceModalOpen(false)
    setDicePreviewGroups(null)
  }

  function openDiceModalFromActionPayload(payload: unknown) {
    const nextDiceEntries = findDiceEntriesInValue(payload)
    if (nextDiceEntries.length === 0) {
      setError("Nenhum dado encontrado nesse card.")
      return
    }

    setError(null)
    setDicePreviewGroups(null)
    setDiceEntries(nextDiceEntries)
    setIsDiceModalOpen(true)
    setIsActionMenuOpen(false)
  }

  async function handleDiceRoll() {
    const entries: Array<{ diceCount: number; diceSides: number }> = []

    for (const entry of diceEntries) {
      const nextDiceCount = Number(entry.diceCount)
      const nextDiceSides = Number(entry.diceSides)

      if (!Number.isInteger(nextDiceCount) || nextDiceCount < 1 || nextDiceCount > 100) {
        setError("Escolha entre 1 e 100 dados por linha.")
        return
      }

      if (!Number.isInteger(nextDiceSides) || nextDiceSides < 2 || nextDiceSides > 1000) {
        setError("Escolha um dado entre 2 e 1000 lados por linha.")
        return
      }

      entries.push({
        diceCount: nextDiceCount,
        diceSides: nextDiceSides,
      })
    }

    let payload: Awaited<ReturnType<typeof httpRpgCampaignRepository.rollDice>>
    try {
      payload = await httpRpgCampaignRepository.rollDice(rpgId, room.campaign.id, { entries })
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel girar os dados.")
      return
    }

    const groups = payload.groups.map((group) => ({
      diceCount: group.diceCount,
      diceSides: group.diceSides,
      results: group.results.map(String),
    }))

    if (room.isOwner) {
      setDicePreviewGroups(groups)
      return
    }

    await submitDiceRoll(groups)
  }

  async function openSkillModal() {
    if (!selectedCharacter?.id || room.isOwner) {
      return
    }

    setIsActionMenuOpen(false)
    setIsSkillModalOpen(true)
    setIsLoadingCharacterAbilities(true)
    setError(null)

    try {
      const payload = await fetchCharacterAbilitiesViewModel(rpgId, selectedCharacter.id)
      setCharacterAbilities(payload.abilities)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel carregar as habilidades.")
    } finally {
      setIsLoadingCharacterAbilities(false)
    }
  }

  async function openItemModal() {
    if (!selectedCharacter?.id || room.isOwner) {
      return
    }

    setIsActionMenuOpen(false)
    setIsItemModalOpen(true)
    setIsLoadingCharacterItems(true)
    setError(null)

    try {
      const payload = await httpCharacterInventoryGateway.fetchInventory(rpgId, selectedCharacter.id)
      setCharacterItems(payload.inventory)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel carregar os itens.")
    } finally {
      setIsLoadingCharacterItems(false)
    }
  }

  async function openDeliveryModal() {
    if (!room.isOwner) {
      return
    }

    setIsActionMenuOpen(false)
    setIsDeliveryModalOpen(true)

    if (deliveryItems.length > 0 || deliverySkills.length > 0 || deliveryCharacters.length > 0) {
      return
    }

    setIsLoadingDeliveryOptions(true)
    setError(null)

    try {
      const [itemsPayload, charactersPayload, skillsPayload] = await Promise.all([
        httpItemsDashboardGateway.fetchDashboardData(rpgId),
        httpRpgDashboardGateway.fetchCharacters(rpgId),
        httpSkillsDashboardGateway.fetchSkills(rpgId),
      ])
      const skillsIndex = await httpSkillsDashboardGateway.fetchSkillsSearchIndex({
        skillIds: skillsPayload.map((skill) => skill.id),
        rpgId,
      })

      setDeliveryItems(itemsPayload.items)
      setDeliveryCharacters(charactersPayload.characters ?? [])
      setDeliverySkills(
        skillsPayload.map((skill) => ({
          ...skill,
          displayName: skillsIndex[skill.id]?.displayName ?? skill.slug,
        })),
      )
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel carregar as opcoes de entrega.")
    } finally {
      setIsLoadingDeliveryOptions(false)
    }
  }

  function buildLocationOptions(detail: RpgMapDetailViewDto): CampaignLocationOption[] {
    const markerById = new Map(
      detail.markerGroups.flatMap((group) =>
        group.markers.map((marker) => [marker.id, marker] as const),
      ),
    )
    const linkedMarkerIds = new Set(
      detail.sections
        .map((section) => getLinkedMarkerId(section.customFields))
        .filter((markerId) => markerId.length > 0),
    )

    const mapOption: CampaignLocationOption = {
      id: `map:${detail.map.id}`,
      sourceKind: "map",
      mapId: detail.map.id,
      mapTitle: detail.map.title,
      title: detail.map.title,
      location: detail.map.type,
      description: detail.map.description,
      image: detail.map.image,
      markerId: null,
    }

    const markerOptions: CampaignLocationOption[] = detail.markerGroups.flatMap((group) =>
      group.markers
        .filter((marker) => !linkedMarkerIds.has(marker.id))
        .map((marker) => ({
          id: `marker:${marker.id}`,
          sourceKind: "marker" as const,
          mapId: detail.map.id,
          mapTitle: detail.map.title,
          title: marker.name,
          location: marker.location,
          description: marker.shortDescription,
          image: marker.image,
          markerId: marker.id,
        })),
    )

    const sectionOptions: CampaignLocationOption[] = detail.sections.map((section) => {
      const linkedMarkerId = getLinkedMarkerId(section.customFields)
      const linkedMarker = linkedMarkerId ? markerById.get(linkedMarkerId) ?? null : null
      const sectionImages = getSectionImages(section.customFields)
      const linkedSectionImage = getCustomFieldText(section.customFields?.[SECTION_LINK_IMAGE])
      const resolvedImage = sectionImages[0] || linkedSectionImage || linkedMarker?.image || null

      return {
        id: `section:${section.id}`,
        sourceKind: "section" as const,
        mapId: detail.map.id,
        mapTitle: detail.map.title,
        title: section.name.trim() || linkedMarker?.name || "Local",
        location: section.type || linkedMarker?.location || null,
        description: section.description || linkedMarker?.shortDescription || null,
        image: resolvedImage,
        markerId: linkedMarker?.id ?? null,
      }
    })

    return [mapOption, ...markerOptions, ...sectionOptions]
  }

  async function openLocationModal() {
    if (!room.isOwner) {
      return
    }

    setIsActionMenuOpen(false)
    setIsLocationModalOpen(true)

    if (locationOptions.length > 0) {
      return
    }

    setIsLoadingLocationOptions(true)
    setError(null)

    try {
      const mapsPayload = await httpRpgMapGateway.fetchMaps(rpgId)
      const details = await Promise.all(
        mapsPayload.maps.map((map) =>
          httpRpgMapGateway.fetchMap(rpgId, map.id).catch(() => null),
        ),
      )
      setLocationOptions(details.flatMap((detail) => (detail ? buildLocationOptions(detail) : [])))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel carregar os locais.")
    } finally {
      setIsLoadingLocationOptions(false)
    }
  }

  async function uploadLocationImage(file: File) {
    if (!room.isOwner) {
      return null
    }

    setIsUploadingLocationImage(true)
    setError(null)

    try {
      const payload = await httpRpgMapGateway.uploadMarkerImage(file)
      return payload.url
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nao foi possivel enviar a imagem do local.")
      return null
    } finally {
      setIsUploadingLocationImage(false)
    }
  }

  async function submitLocation(payload: Omit<LocationActionPayload, "type" | "combatId">) {
    if (!room.isOwner) {
      return
    }

    const title = payload.title.trim()
    if (!title) {
      setError("Informe um nome para o local.")
      return
    }

    const content = buildLocationActionContent({
      ...payload,
      type: "location",
      combatId: activeCombatRoomId,
      title,
      description: payload.description?.trim() || null,
      image: payload.image?.trim() || null,
      location: payload.location?.trim() || null,
    } satisfies LocationActionPayload)

    await runAction(async () => {
      const response = await httpRpgCampaignRepository.sendMessage(rpgId, room.campaign.id, {
        content,
        kind: "action",
      })

      if ("chatMessage" in response && response.chatMessage) {
        appendMessageLocally(response.chatMessage)
      }

      setIsLocationModalOpen(false)
      return response
    })
  }

  async function submitDeliveryOffer(params: {
    mode: "single" | "chest"
    assets: DeliveryOfferAsset[]
    recipients: Array<{ userId: string; characterId: string }>
  }) {
    if (!room.isOwner) {
      return
    }

    const content = buildDeliveryOfferActionContent({
      type: "delivery_offer",
      combatId: activeCombatRoomId,
      offerId: globalThis.crypto?.randomUUID?.() ?? `offer-${Date.now()}`,
      mode: params.mode,
      assets: params.assets,
      recipientUserIds: params.recipients.map((recipient) => recipient.userId),
      recipientCharacterIds: params.recipients.map((recipient) => recipient.characterId),
    } satisfies DeliveryOfferActionPayload)

    await runAction(async () => {
      const payload = await httpRpgCampaignRepository.sendMessage(rpgId, room.campaign.id, {
        content,
        kind: "action",
      })

      if ("chatMessage" in payload && payload.chatMessage) {
        appendMessageLocally(payload.chatMessage)
      }

      setIsDeliveryModalOpen(false)
      return payload
    })
  }

  async function openLatestAbilityDetails(params: {
    ability: PurchasedAbilityViewDto
    mode: "view" | "use"
    characterId?: string | null
  }) {
    setSelectedAbilityDetailsMode(params.mode)

    if (!params.characterId) {
      const cachedAbility =
        characterAbilities.find(
          (item) =>
            item.skillId === params.ability.skillId &&
            item.levelNumber === params.ability.levelNumber,
        ) ?? params.ability

      setSelectedAbilityDetails(cachedAbility)
      return
    }

    try {
      const payload = await fetchCharacterAbilitiesViewModel(rpgId, params.characterId)
      setCharacterAbilities(payload.abilities)
      const latestAbility =
        payload.abilities.find(
          (item) =>
            item.skillId === params.ability.skillId &&
            item.levelNumber === params.ability.levelNumber,
        ) ?? params.ability

      setSelectedAbilityDetails(latestAbility)
    } catch {
      setSelectedAbilityDetails(params.ability)
    }
  }

  async function openLatestItemDetails(params: {
    item: CharacterInventoryItemDto
    mode: "view" | "use"
    characterId?: string | null
  }) {
    setSelectedItemDetailsMode(params.mode)

    if (!params.characterId) {
      const cachedItem = characterItems.find((item) => item.id === params.item.id) ?? params.item
      setSelectedItemDetails(cachedItem)
      return
    }

    try {
      const payload = await httpCharacterInventoryGateway.fetchInventory(rpgId, params.characterId)
      setCharacterItems(payload.inventory)
      const latestItem = payload.inventory.find((item) => item.id === params.item.id) ?? params.item
      setSelectedItemDetails(latestItem)
    } catch {
      setSelectedItemDetails(params.item)
    }
  }

  async function handleUseAbility(ability: PurchasedAbilityViewDto) {
    if (!selectedCharacter) {
      setError("Selecione um personagem para usar habilidade.")
      return
    }

    const content = buildSkillUseActionContent({
      type: "skill_use",
      combatId: activeCombatRoomId,
      stealth: isStealthMode,
      characterId: selectedCharacter.id,
      characterName: selectedCharacter.name,
      ability,
    } satisfies SkillUseActionPayload)

    await runAction(async () => {
      const payload = await httpRpgCampaignRepository.sendMessage(rpgId, room.campaign.id, {
        content,
        kind: "action",
      })

      if ("chatMessage" in payload && payload.chatMessage) {
        appendMessageLocally(payload.chatMessage)
      }

      setIsSkillModalOpen(false)
      setSelectedAbilityDetails(null)
      setSelectedAbilityDetailsMode("view")
      return payload
    })
  }

  async function handleUseItem(item: CharacterInventoryItemDto) {
    if (!selectedCharacter) {
      setError("Selecione um personagem para usar item.")
      return
    }

    const content = buildItemUseActionContent({
      type: "item_use",
      combatId: activeCombatRoomId,
      stealth: isStealthMode,
      characterId: selectedCharacter.id,
      characterName: selectedCharacter.name,
      item,
    } satisfies ItemUseActionPayload)

    await runAction(async () => {
      const payload = await httpRpgCampaignRepository.sendMessage(rpgId, room.campaign.id, {
        content,
        kind: "action",
      })

      if ("chatMessage" in payload && payload.chatMessage) {
        appendMessageLocally(payload.chatMessage)
      }

      setIsItemModalOpen(false)
      setSelectedItemDetails(null)
      setSelectedItemDetailsMode("view")
      return payload
    })
  }

  async function handleRevokeActionMessage() {
    if (!revokeActionMessageId) {
      return
    }

    const messageId = revokeActionMessageId
    await runAction(async () => {
      const payload = await httpRpgCampaignRepository.revokeActionMessage(
        rpgId,
        room.campaign.id,
        messageId,
      )

      setRevokeActionMessageId(null)
      setExpandedActionIds((currentState) => {
        const nextState = { ...currentState }
        delete nextState[messageId]
        return nextState
      })
      setRoom((currentRoom) => ({
        ...currentRoom,
        actionMessages: currentRoom.actionMessages.filter((message) => message.id !== messageId),
      }))
      return payload
    })
  }

  async function handleAcceptDeliveryOffer(
    messageId: string,
    offer: DeliveryOfferActionPayload,
    options: { revealToRoom?: boolean } = {},
  ) {
    if (!selectedCharacter) {
      setError("Selecione um personagem para receber a entrega.")
      return false
    }

    const isTargeted = offer.recipientUserIds.length > 0 || offer.recipientCharacterIds.length > 0
    const canReceive =
      !isTargeted ||
      offer.recipientUserIds.includes(room.viewerUserId) ||
      offer.recipientCharacterIds.includes(selectedCharacter.id)

    if (!canReceive) {
      setError("Essa entrega nao esta destinada ao seu personagem.")
      return false
    }

    return runAction(async () => {
      return httpRpgCampaignRepository.acceptDeliveryOffer(rpgId, room.campaign.id, messageId, {
        characterId: selectedCharacter.id,
        offerId: offer.offerId,
        revealToRoom: options.revealToRoom === true,
      })
    })
  }

  async function submitDiceRoll(groupsSource: DiceRollPreviewGroup[]) {
    const groups: DiceRollGroup[] = []

    for (const group of groupsSource) {
      const results = group.results.map((value) => Number(value))
      const hasInvalidValue = results.some(
        (value) => !Number.isInteger(value) || value < 1 || value > group.diceSides,
      )

      if (hasInvalidValue) {
        setError(`Os resultados de ${group.diceCount}d${group.diceSides} precisam ficar entre 1 e ${group.diceSides}.`)
        return
      }

      groups.push({
        diceCount: group.diceCount,
        diceSides: group.diceSides,
        results,
        total: results.reduce((sum, value) => sum + value, 0),
      })
    }

    const total = groups.reduce((sum, group) => sum + group.total, 0)
    const content = buildDiceRollActionContent({
      type: "dice_roll",
      combatId: activeCombatRoomId,
      stealth: isStealthMode && !room.isOwner,
      total,
      groups,
    } satisfies DiceRollActionPayload)

    await runAction(async () => {
      const payload = await httpRpgCampaignRepository.sendMessage(rpgId, room.campaign.id, {
        content,
        kind: "action",
      })

      if ("chatMessage" in payload && payload.chatMessage) {
        appendMessageLocally(payload.chatMessage)
      }

      setIsDiceModalOpen(false)
      setIsActionMenuOpen(false)
      setDiceEntries([{ diceCount: "1", diceSides: "20" }])
      setDicePreviewGroups(null)
      return payload
    })
  }

  return {
    characterAbilities,
    characterItems,
    closeDiceModal,
    diceEntries,
    dicePreviewGroups,
    deliveryCharacters,
    deliveryItems,
    deliverySkills,
    expandedActionIds,
    expandedRollIds,
    handleAcceptDeliveryOffer,
    handleDiceRoll,
    handleRevokeActionMessage,
    handleUseAbility,
    handleUseItem,
    isActionMenuOpen,
    isDeliveryModalOpen,
    isDiceModalOpen,
    isItemModalOpen,
    isLoadingCharacterAbilities,
    isLoadingCharacterItems,
    isLoadingDeliveryOptions,
    isLoadingLocationOptions,
    isSkillModalOpen,
    isStealthMode,
    isLocationModalOpen,
    isUploadingLocationImage,
    locationOptions,
    openDiceModalFromActionPayload,
    openDeliveryModal,
    openItemModal,
    openLocationModal,
    openLatestAbilityDetails,
    openLatestItemDetails,
    openSkillModal,
    revokeActionMessageId,
    selectedAbilityDetails,
    selectedAbilityDetailsMode,
    selectedItemDetails,
    selectedItemDetailsMode,
    setDiceEntries,
    setDicePreviewGroups,
    setExpandedActionIds,
    setExpandedRollIds,
    setIsActionMenuOpen,
    setIsDeliveryModalOpen,
    setIsDiceModalOpen,
    setIsItemModalOpen,
    setIsLocationModalOpen,
    setIsSkillModalOpen,
    setIsStealthMode,
    setRevokeActionMessageId,
    setSelectedAbilityDetails,
    setSelectedAbilityDetailsMode,
    setSelectedItemDetails,
    setSelectedItemDetailsMode,
    submitDiceRoll,
    submitDeliveryOffer,
    submitLocation,
    uploadLocationImage,
  }
}

export type CampaignRoomActions = ReturnType<typeof useCampaignRoomActions>
