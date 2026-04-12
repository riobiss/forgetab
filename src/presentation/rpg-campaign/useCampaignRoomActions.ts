"use client"

import { useState, type Dispatch, type SetStateAction } from "react"
import type { CharacterInventoryItemDto } from "@/application/characterInventory/types"
import type { PurchasedAbilityViewDto } from "@/application/characterAbilities/types"
import type { BaseItemDto } from "@/application/itemsDashboard/types"
import type { DashboardCharacterSummary } from "@/application/rpgDashboard/contracts/RpgDashboardGateway"
import type { RpgCampaignRoomViewModel } from "@/application/rpgCampaign/types"
import type { SkillListItemDto } from "@/application/skillsDashboard/types"
import { fetchCharacterAbilitiesViewModel } from "@/infrastructure/characterAbilities/repositories/httpCharacterAbilitiesPageRepository"
import { httpCharacterInventoryGateway } from "@/infrastructure/characterInventory/gateways/httpCharacterInventoryGateway"
import { httpItemsDashboardGateway } from "@/infrastructure/itemsDashboard/gateways/httpItemsDashboardGateway"
import { httpRpgDashboardGateway } from "@/infrastructure/rpgDashboard/gateways/httpRpgDashboardGateway"
import type { CampaignSelectedCharacter } from "@/infrastructure/rpgCampaign/campaignPresence"
import { httpRpgCampaignRepository } from "@/infrastructure/rpgCampaign/repositories/httpRpgCampaignRepository"
import { httpSkillsDashboardGateway } from "@/infrastructure/skillsDashboard/gateways/httpSkillsDashboardGateway"
import {
  buildDeliveryOfferActionContent,
  buildDiceRollActionContent,
  buildItemUseActionContent,
  buildSkillUseActionContent,
  type DeliveryOfferActionPayload,
  type DeliveryOfferAsset,
  type DiceRollActionPayload,
  type DiceRollGroup,
  type DiceRollPreviewGroup,
  findDiceEntriesInValue,
  type ItemUseActionPayload,
  type SkillUseActionPayload,
} from "./actionMessages"

type CampaignRoomMessage = RpgCampaignRoomViewModel["campaignMessages"][number]

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
  const [isLoadingDeliveryOptions, setIsLoadingDeliveryOptions] = useState(false)
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
    isSkillModalOpen,
    isStealthMode,
    openDiceModalFromActionPayload,
    openDeliveryModal,
    openItemModal,
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
    setIsSkillModalOpen,
    setIsStealthMode,
    setRevokeActionMessageId,
    setSelectedAbilityDetails,
    setSelectedAbilityDetailsMode,
    setSelectedItemDetails,
    setSelectedItemDetailsMode,
    submitDiceRoll,
    submitDeliveryOffer,
  }
}

export type CampaignRoomActions = ReturnType<typeof useCampaignRoomActions>
