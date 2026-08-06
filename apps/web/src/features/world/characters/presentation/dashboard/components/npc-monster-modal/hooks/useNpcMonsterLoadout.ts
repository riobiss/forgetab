"use client"

import { useDeferredValue, useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import {
  addNpcMonsterAbilityUseCase,
  addNpcMonsterInventoryItemUseCase,
  listNpcMonsterItemOptionsUseCase,
  listNpcMonsterSkillOptionsUseCase,
  loadNpcMonsterAbilitiesUseCase,
  loadNpcMonsterInventoryUseCase,
  removeNpcMonsterAbilityUseCase,
  removeNpcMonsterInventoryItemUseCase,
} from "@/features/world/characters/application/loadout"
import { npcMonsterLoadoutDependencies } from "@/features/world/characters/presentation/dashboard/dependencies"
import type { PickerMode } from "@/features/world/characters/presentation/dashboard/components/npc-monster-modal/types"

type Params = {
  isOpen: boolean
  rpgId: string
  characterId: string | null
}

export function useNpcMonsterLoadout({ isOpen, rpgId, characterId }: Params) {
  const [inventory, setInventory] = useState<Awaited<
    ReturnType<typeof loadNpcMonsterInventoryUseCase>
  >["inventory"]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState("")
  const [availableItems, setAvailableItems] = useState<Awaited<
    ReturnType<typeof listNpcMonsterItemOptionsUseCase>
  >>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [abilities, setAbilities] = useState<Awaited<
    ReturnType<typeof loadNpcMonsterAbilitiesUseCase>
  >["abilities"]>([])
  const [abilitiesLoading, setAbilitiesLoading] = useState(false)
  const [abilitiesError, setAbilitiesError] = useState("")
  const [availableSkills, setAvailableSkills] = useState<Awaited<
    ReturnType<typeof listNpcMonsterSkillOptionsUseCase>
  >>([])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>(null)
  const [pickerSearch, setPickerSearch] = useState("")
  const deferredPickerSearch = useDeferredValue(pickerSearch)
  const [pickerSaving, setPickerSaving] = useState(false)
  const [removingAbilityKey, setRemovingAbilityKey] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (!isOpen) {
      setInventory([])
      setInventoryError("")
      setAvailableItems([])
      setAbilities([])
      setAbilitiesError("")
      setAvailableSkills([])
      setPickerMode(null)
      setPickerSearch("")
      setRemovingAbilityKey(null)
      return
    }

    let cancelled = false

    async function load() {
      setItemsLoading(true)
      setSkillsLoading(true)
      setInventoryLoading(Boolean(characterId))
      setAbilitiesLoading(Boolean(characterId))

      const [itemsResult, skillsResult, inventoryResult, abilitiesResult] =
        await Promise.allSettled([
          listNpcMonsterItemOptionsUseCase(npcMonsterLoadoutDependencies, {
            rpgId,
          }),
          listNpcMonsterSkillOptionsUseCase(npcMonsterLoadoutDependencies, {
            rpgId,
          }),
          characterId
            ? loadNpcMonsterInventoryUseCase(npcMonsterLoadoutDependencies, {
                rpgId,
                characterId,
              })
            : Promise.resolve(null),
          characterId
            ? loadNpcMonsterAbilitiesUseCase(npcMonsterLoadoutDependencies, {
                rpgId,
                characterId,
              })
            : Promise.resolve(null),
        ])

      if (cancelled) return

      if (itemsResult.status === "fulfilled") {
        setAvailableItems(itemsResult.value)
      }
      if (skillsResult.status === "fulfilled") {
        setAvailableSkills(skillsResult.value)
      }
      if (inventoryResult.status === "fulfilled") {
        setInventory(inventoryResult.value?.inventory ?? [])
      } else if (characterId) {
        setInventoryError(
          inventoryResult.reason instanceof Error
            ? inventoryResult.reason.message
            : "Nao foi possivel carregar o inventory.",
        )
      }
      if (abilitiesResult.status === "fulfilled") {
        setAbilities(abilitiesResult.value?.abilities ?? [])
      } else if (characterId) {
        setAbilitiesError(
          abilitiesResult.reason instanceof Error
            ? abilitiesResult.reason.message
            : "Nao foi possivel carregar as habilidades.",
        )
      }

      setItemsLoading(false)
      setSkillsLoading(false)
      setInventoryLoading(false)
      setAbilitiesLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [characterId, isOpen, rpgId])

  const normalizedSearch = deferredPickerSearch.trim().toLowerCase()
  const filteredAvailableItems = !normalizedSearch
    ? availableItems
    : availableItems.filter((item) =>
        [item.name, item.type, item.rarity]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      )
  const ownedSkillIds = new Set(abilities.map((item) => item.skillId))
  const filteredAvailableSkills = (
    !normalizedSearch
      ? availableSkills
      : availableSkills.filter((item) =>
          [item.slug, item.tags.join(" ")]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch),
        )
  ).filter((item) => !ownedSkillIds.has(item.id))

  function openPicker(mode: Exclude<PickerMode, null>) {
    setPickerSearch("")
    setPickerMode(mode)
  }

  async function addInventoryItem(baseItemId: string) {
    if (!characterId || pickerSaving) return

    try {
      setPickerSaving(true)
      setInventoryError("")
      await addNpcMonsterInventoryItemUseCase(npcMonsterLoadoutDependencies, {
        rpgId,
        characterId,
        baseItemId,
        quantity: 1,
      })
      const payload = await loadNpcMonsterInventoryUseCase(
        npcMonsterLoadoutDependencies,
        { rpgId, characterId },
      )
      setInventory(payload.inventory)
      setPickerMode(null)
      setPickerSearch("")
      toast.success("Item adicionado com sucesso.")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Nao foi possivel adicionar o item."
      setInventoryError(message)
      toast.error(message)
    } finally {
      setPickerSaving(false)
    }
  }

  async function removeInventoryItem(inventoryItemId: string, quantity = 1) {
    if (!characterId) return

    try {
      setInventoryError("")
      const payload = await removeNpcMonsterInventoryItemUseCase(
        npcMonsterLoadoutDependencies,
        { rpgId, characterId, inventoryItemId, quantity },
      )
      setInventory((current) =>
        payload.remainingQuantity <= 0
          ? current.filter((item) => item.id !== inventoryItemId)
          : current.map((item) =>
              item.id === inventoryItemId
                ? { ...item, quantity: payload.remainingQuantity }
                : item,
            ),
      )
      toast.success("Item removido com sucesso.")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Nao foi possivel remover o item."
      setInventoryError(message)
      toast.error(message)
    }
  }

  async function addAbility(skillId: string) {
    if (!characterId || pickerSaving) return

    try {
      setPickerSaving(true)
      setAbilitiesError("")
      const payload = await addNpcMonsterAbilityUseCase(
        npcMonsterLoadoutDependencies,
        { rpgId, characterId, skillId, level: 1 },
      )
      if (payload.ability) {
        setAbilities((current) => [
          ...current.filter((item) => item.skillId !== skillId),
          payload.ability!,
        ])
      } else {
        const refreshed = await loadNpcMonsterAbilitiesUseCase(
          npcMonsterLoadoutDependencies,
          { rpgId, characterId },
        )
        setAbilities(refreshed.abilities)
      }
      setPickerMode(null)
      setPickerSearch("")
      toast.success("Habilidade adicionada com sucesso.")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Nao foi possivel adicionar a habilidade."
      setAbilitiesError(message)
      toast.error(message)
    } finally {
      setPickerSaving(false)
    }
  }

  async function removeAbility(skillId: string, level: number) {
    if (!characterId) return

    const abilityKey = `${skillId}:${level}`
    try {
      setRemovingAbilityKey(abilityKey)
      setAbilitiesError("")
      const payload = await removeNpcMonsterAbilityUseCase(
        npcMonsterLoadoutDependencies,
        { rpgId, characterId, skillId, level },
      )
      if (!payload.success) {
        throw new Error("Nao foi possivel remover a habilidade.")
      }
      setAbilities((current) =>
        current.filter(
          (item) => !(item.skillId === skillId && item.levelNumber === level),
        ),
      )
      toast.success("Habilidade removida com sucesso.")
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Nao foi possivel remover a habilidade."
      setAbilitiesError(message)
      toast.error(message)
    } finally {
      setRemovingAbilityKey(null)
    }
  }

  return {
    inventory,
    inventoryLoading,
    inventoryError,
    itemsLoading,
    abilities,
    abilitiesLoading,
    abilitiesError,
    skillsLoading,
    pickerMode,
    setPickerMode,
    pickerSearch,
    setPickerSearch,
    pickerSaving,
    removingAbilityKey,
    filteredAvailableItems,
    filteredAvailableSkills,
    openPicker,
    addInventoryItem,
    removeInventoryItem,
    addAbility,
    removeAbility,
  }
}
