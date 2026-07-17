"use client"

import { Dispatch, SetStateAction, useState } from "react"
import type {
  AttributeTemplate,
  CharacterIdentityTemplate,
  IdentityTemplate,
  SkillTemplate,
} from "../components/shared/types"
import {
  enforceXpLevelPattern,
  getDefaultProgressionTiers,
  type ProgressionMode,
  type ProgressionTier,
} from "@/lib/rpg/progression"
import {
  abilityCategoryKeys,
  normalizeEnabledAbilityCategories,
  type AbilityCategoryKey,
} from "@/lib/rpg/abilityCategories"

export type Visibility = "private" | "public"

function slugifyLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function useEditRpgState() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState("")
  const [visibility, setVisibility] = useState<Visibility>("private")
  const [useMundiMap, setUseMundiMap] = useState(false)
  const [useRaceBonuses, setUseRaceBonuses] = useState(false)
  const [useClassBonuses, setUseClassBonuses] = useState(false)
  const [useInventoryWeightLimit, setUseInventoryWeightLimit] = useState(false)
  const [allowMultiplePlayerCharacters, setAllowMultiplePlayerCharacters] = useState(false)
  const [usersCanManageOwnXp, setUsersCanManageOwnXp] = useState(true)
  const [allowSkillPointDistribution, setAllowSkillPointDistribution] = useState(true)
  const [abilityCategoriesEnabled, setAbilityCategoriesEnabled] = useState(false)
  const [enabledAbilityCategories, setEnabledAbilityCategories] = useState<AbilityCategoryKey[]>(
    [],
  )
  const [costsEnabled, setCostsEnabled] = useState(false)
  const [costResourceName, setCostResourceName] = useState("Skill Points")
  const [progressionMode, setProgressionMode] = useState<ProgressionMode>("xp_level")
  const [progressionTiers, setProgressionTiers] = useState<ProgressionTier[]>(
    getDefaultProgressionTiers("xp_level"),
  )

  const [attributeTemplates, setAttributeTemplates] = useState<AttributeTemplate[]>([])
  const [selectedStatusKeys, setSelectedStatusKeys] = useState<string[]>([])
  const [statusLabelByKey, setStatusLabelByKey] = useState<Record<string, string>>({})
  const [newCustomStatusLabel, setNewCustomStatusLabel] = useState("")
  const [skillTemplates, setSkillTemplates] = useState<SkillTemplate[]>([])
  const [newSkillLabel, setNewSkillLabel] = useState("")
  const [newAttributeLabel, setNewAttributeLabel] = useState("")

  const [raceDrafts, setRaceDrafts] = useState<IdentityTemplate[]>([])
  const [classDrafts, setClassDrafts] = useState<IdentityTemplate[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAttributeList, setShowAttributeList] = useState(false)
  const [showStatusList, setShowStatusList] = useState(false)
  const [showSkillList, setShowSkillList] = useState(false)
  const [showAbilityCategoriesList, setShowAbilityCategoriesList] = useState(false)
  const [showRaceList, setShowRaceList] = useState(false)
  const [showClassList, setShowClassList] = useState(false)
  const [showCharacterIdentityList, setShowCharacterIdentityList] = useState(false)
  const [characterIdentityTemplates, setCharacterIdentityTemplates] = useState<
    CharacterIdentityTemplate[]
  >([])
  const [newIdentityLabel, setNewIdentityLabel] = useState("")
  const [showCharacterCharacteristicsList, setShowCharacterCharacteristicsList] = useState(false)
  const [characterCharacteristicTemplates, setCharacterCharacteristicTemplates] = useState<
    CharacterIdentityTemplate[]
  >([])
  const [newCharacteristicLabel, setNewCharacteristicLabel] = useState("")

  function toggleKeyInList(
    key: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) {
    setter((prev) =>
      prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key],
    )
  }

  function toggleStatusKey(key: string) {
    toggleKeyInList(key, setSelectedStatusKeys)
  }

  function addCustomStatus() {
    const label = newCustomStatusLabel.trim()
    if (label.length < 2) return
    const key = slugifyLabel(label)
    if (key.length < 2) return

    setSelectedStatusKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
    setStatusLabelByKey((prev) => ({ ...prev, [key]: label }))
    setNewCustomStatusLabel("")
  }

  function updateCustomStatusLabel(key: string, value: string) {
    setStatusLabelByKey((prev) => ({ ...prev, [key]: value }))
  }

  function removeCustomStatus(key: string) {
    setSelectedStatusKeys((prev) => prev.filter((current) => current !== key))
    setStatusLabelByKey((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function addSkill() {
    const label = newSkillLabel.trim()
    if (label.length < 2) return
    const key = slugifyLabel(label)
    if (!key) return

    setSkillTemplates((prev) =>
      prev.some((item) => item.key === key || item.label === label) ? prev : [...prev, { key, label }],
    )
    setNewSkillLabel("")
  }

  function removeSkill(key: string) {
    setSkillTemplates((prev) => prev.filter((current) => current.key !== key))
  }

  function addAttribute() {
    const label = newAttributeLabel.trim()
    if (label.length < 2) return
    const baseKey = slugifyLabel(label)
    if (!baseKey) return

    setAttributeTemplates((prev) => {
      if (prev.some((item) => item.label.toLowerCase() === label.toLowerCase())) {
        return prev
      }

      const usedKeys = new Set(prev.map((item) => item.key))
      let key = baseKey
      let suffix = 2

      while (usedKeys.has(key)) {
        key = `${baseKey}-${suffix}`
        suffix += 1
      }

      return [...prev, { key, label }]
    })

    setNewAttributeLabel("")
  }

  function removeAttribute(key: string) {
    setAttributeTemplates((prev) => prev.filter((item) => item.key !== key))
  }

  function addIdentityField() {
    const label = newIdentityLabel.trim()
    if (label.length < 2) return

    setCharacterIdentityTemplates((prev) => [
      ...prev,
      {
        key: `draft-${crypto.randomUUID()}`,
        label,
        required: true,
        position: prev.length,
      },
    ])
    setNewIdentityLabel("")
  }

  function updateIdentityFieldLabel(index: number, value: string) {
    setCharacterIdentityTemplates((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? { ...item, label: value } : item,
      ),
    )
  }

  function updateIdentityFieldRequired(index: number, value: boolean) {
    setCharacterIdentityTemplates((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? { ...item, required: value } : item,
      ),
    )
  }

  function removeIdentityField(index: number) {
    setCharacterIdentityTemplates((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index),
    )
  }

  function addCharacteristicField() {
    const label = newCharacteristicLabel.trim()
    if (label.length < 2) return

    setCharacterCharacteristicTemplates((prev) => [
      ...prev,
      {
        key: `draft-${crypto.randomUUID()}`,
        label,
        required: true,
        position: prev.length,
      },
    ])
    setNewCharacteristicLabel("")
  }

  function updateCharacteristicFieldLabel(index: number, value: string) {
    setCharacterCharacteristicTemplates((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? { ...item, label: value } : item,
      ),
    )
  }

  function updateCharacteristicFieldRequired(index: number, value: boolean) {
    setCharacterCharacteristicTemplates((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? { ...item, required: value } : item,
      ),
    )
  }

  function removeCharacteristicField(index: number) {
    setCharacterCharacteristicTemplates((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index),
    )
  }

  function addProgressionTier() {
    setProgressionTiers((prev) => {
      if (progressionMode === "xp_level") {
        const previousRequired = prev.length > 0 ? prev[prev.length - 1].required : 0
        return enforceXpLevelPattern([
          ...prev,
          { label: "Level", required: Math.max(0, previousRequired + 100) },
        ])
      }

      return [...prev, { label: "Etapa", required: 0 }]
    })
  }

  function updateProgressionTierLabel(index: number, label: string) {
    if (progressionMode === "xp_level") {
      return
    }

    setProgressionTiers((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index ? { ...item, label } : item,
      ),
    )
  }

  function updateProgressionTierRequired(index: number, required: number) {
    setProgressionTiers((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index
          ? { ...item, required: Number.isFinite(required) ? Math.max(0, Math.floor(required)) : 0 }
          : item,
      ),
    )
  }

  function removeProgressionTier(index: number) {
    setProgressionTiers((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  function toggleAbilityCategory(category: AbilityCategoryKey) {
    setEnabledAbilityCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : normalizeEnabledAbilityCategories([...prev, category]),
    )
  }

  function resetAbilityCategoriesToAll() {
    setEnabledAbilityCategories([...abilityCategoryKeys])
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    image,
    setImage,
    visibility,
    setVisibility,
    useMundiMap,
    setUseMundiMap,
    useRaceBonuses,
    setUseRaceBonuses,
    useClassBonuses,
    setUseClassBonuses,
    useInventoryWeightLimit,
    setUseInventoryWeightLimit,
    allowMultiplePlayerCharacters,
    setAllowMultiplePlayerCharacters,
    usersCanManageOwnXp,
    setUsersCanManageOwnXp,
    allowSkillPointDistribution,
    setAllowSkillPointDistribution,
    abilityCategoriesEnabled,
    setAbilityCategoriesEnabled,
    enabledAbilityCategories,
    setEnabledAbilityCategories,
    costsEnabled,
    setCostsEnabled,
    costResourceName,
    setCostResourceName,
    progressionMode,
    setProgressionMode,
    progressionTiers,
    setProgressionTiers,
    attributeTemplates,
    setAttributeTemplates,
    selectedStatusKeys,
    setSelectedStatusKeys,
    statusLabelByKey,
    setStatusLabelByKey,
    newCustomStatusLabel,
    setNewCustomStatusLabel,
    skillTemplates,
    setSkillTemplates,
    newSkillLabel,
    setNewSkillLabel,
    raceDrafts,
    setRaceDrafts,
    classDrafts,
    setClassDrafts,
    showAdvanced,
    setShowAdvanced,
    showAttributeList,
    setShowAttributeList,
    showStatusList,
    setShowStatusList,
    showSkillList,
    setShowSkillList,
    showAbilityCategoriesList,
    setShowAbilityCategoriesList,
    showRaceList,
    setShowRaceList,
    showClassList,
    setShowClassList,
    showCharacterIdentityList,
    setShowCharacterIdentityList,
    characterIdentityTemplates,
    setCharacterIdentityTemplates,
    newIdentityLabel,
    setNewIdentityLabel,
    showCharacterCharacteristicsList,
    setShowCharacterCharacteristicsList,
    characterCharacteristicTemplates,
    setCharacterCharacteristicTemplates,
    newCharacteristicLabel,
    setNewCharacteristicLabel,
    toggleStatusKey,
    addCustomStatus,
    updateCustomStatusLabel,
    removeCustomStatus,
    addSkill,
    removeSkill,
    newAttributeLabel,
    setNewAttributeLabel,
    addAttribute,
    removeAttribute,
    addIdentityField,
    updateIdentityFieldLabel,
    updateIdentityFieldRequired,
    removeIdentityField,
    addCharacteristicField,
    updateCharacteristicFieldLabel,
    updateCharacteristicFieldRequired,
    removeCharacteristicField,
    addProgressionTier,
    updateProgressionTierLabel,
    updateProgressionTierRequired,
    removeProgressionTier,
    toggleAbilityCategory,
    resetAbilityCategoriesToAll,
  }
}
