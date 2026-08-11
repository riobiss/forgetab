import type { CSSProperties } from "react"
import { getSkillTagMeta } from "@forgetab/world-contracts/rpg/skillTags"

export const SKILL_CATEGORY_LABEL: Record<string, string> = {
  tecnicas: "Técnicas",
  arcana: "Arcana",
  espiritual: "Espiritual",
  mental: "Mental",
  natural: "Natural",
  tecnologica: "Tecnológica"
}

export const SKILL_TYPE_LABEL: Record<string, string> = {
  attack: "Ataque",
  burst: "Explosao",
  support: "Suporte",
  buff: "Buff",
  debuff: "Debuff",
  control: "Controle",
  defense: "Defesa",
  mobility: "Mobilidade",
  summon: "Invocacao",
  utility: "Utilidade",
  resource: "Recurso"
}

export const SKILL_ACTION_TYPE_LABEL: Record<string, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva"
}

export function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

export function toCategoryLabel(value: string | null) {
  return value ? (SKILL_CATEGORY_LABEL[value] ?? value) : null
}

export function toTypeLabel(value: string | null) {
  return value ? (SKILL_TYPE_LABEL[value] ?? value) : null
}

export function toActionTypeLabel(value: string | null) {
  return value ? (SKILL_ACTION_TYPE_LABEL[value] ?? value) : null
}

export function getAbilityCardStyle(tag: string | undefined) {
  const meta = tag ? getSkillTagMeta(tag) : null
  if (!meta) return undefined

  return {
    "--tag-card-c1": meta.cardC1,
    "--tag-card-c2": meta.cardC2,
    "--tag-card-c3": meta.cardC3,
    "--tag-card-border": meta.cardBorder,
    "--tag-card-glow": meta.cardGlow,
    "--tag-card-key-text": meta.cardKeyText,
    "--tag-card-value-text": meta.cardValueText
  } as CSSProperties
}

export function getDistinctLevelDescription(params: {
  skillDescription: string | null
  levelDescription: string | null
  summary: string | null
}) {
  const levelDescription = hasText(params.levelDescription)
    ? params.levelDescription
    : hasText(params.summary)
      ? params.summary
      : null
  const normalizedLevel = levelDescription?.trim() ?? ""
  return normalizedLevel && normalizedLevel !== params.skillDescription?.trim()
    ? levelDescription
    : null
}
