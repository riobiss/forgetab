import type { CharacterDetailViewModel } from "@/features/world/characters/application/detail/types"
import type { CharacterRevealSection } from "./actionMessages"

export type CharacterRevealField =
  | "statuses"
  | "attributes"
  | "skills"
  | "progression"
  | "about"
  | "identity"
  | "characteristics"

export const CHARACTER_REVEAL_FIELD_LABEL: Record<
  CharacterRevealField,
  string
> = {
  statuses: "Status",
  attributes: "Atributos",
  skills: "Pericias",
  progression: "Progressao",
  about: "Sobre",
  identity: "Identidade",
  characteristics: "Caracteristicas"
}

export function createInitialCharacterRevealFields(): Record<
  CharacterRevealField,
  boolean
> {
  return {
    statuses: false,
    attributes: false,
    skills: false,
    progression: false,
    about: false,
    identity: false,
    characteristics: false
  }
}

export function getAvailableRevealFields(
  character: CharacterDetailViewModel
): CharacterRevealField[] {
  const fields: CharacterRevealField[] = []
  if (character.statusEntries.length > 0 && !character.maskStatuses)
    fields.push("statuses")
  if (character.attributeEntries.length > 0 && !character.maskAttributes)
    fields.push("attributes")
  if (character.skillEntries.length > 0 && !character.maskSkills)
    fields.push("skills")
  fields.push("progression")
  if (character.aboutText) fields.push("about")
  if (character.identityItems.length > 0) fields.push("identity")
  if (character.characteristicsItems.length > 0) fields.push("characteristics")
  return fields
}

export function buildCharacterRevealSections(
  character: CharacterDetailViewModel,
  fields: Record<CharacterRevealField, boolean>
): CharacterRevealSection[] {
  const sections: CharacterRevealSection[] = []

  if (fields.statuses && !character.maskStatuses) {
    sections.push({
      key: "statuses",
      title: "Status",
      entries: character.statusEntries.map((item) => ({
        key: item.key,
        label: item.label,
        value: `${item.current}/${item.max}`
      }))
    })
  }

  if (fields.attributes && !character.maskAttributes) {
    sections.push({
      key: "attributes",
      title: "Atributos",
      entries: character.attributeEntries.map((item) => ({
        key: item.key,
        label: item.label,
        value: item.value
      }))
    })
  }

  if (fields.skills && !character.maskSkills) {
    sections.push({
      key: "skills",
      title: "Pericias",
      entries: character.skillEntries.map((item) => ({
        key: item.key,
        label: item.label,
        value: item.value
      }))
    })
  }

  if (fields.progression) {
    sections.push({
      key: "progression",
      title: "Progressao",
      entries: [
        {
          key: "level",
          label: "Level",
          value: character.progressionLevelDisplay
        },
        { key: "xp", label: "XP", value: character.progressionCurrent }
      ]
    })
  }

  if (fields.about && character.aboutText) {
    sections.push({
      key: "about",
      title: "Sobre",
      entries: [{ key: "about", label: "Sobre", value: character.aboutText }]
    })
  }

  if (fields.identity) {
    sections.push({
      key: "identity",
      title: "Identidade",
      entries: character.identityItems.map((item) => ({
        key: item.key,
        label: item.label,
        value: item.value.trim() || "-"
      }))
    })
  }

  if (fields.characteristics) {
    sections.push({
      key: "characteristics",
      title: "Caracteristicas",
      entries: character.characteristicsItems.map((item) => ({
        key: item.key,
        label: item.label,
        value: item.value.trim() || "-"
      }))
    })
  }

  return sections.filter((section) => section.entries.length > 0)
}
