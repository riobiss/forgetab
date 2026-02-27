import { skillTagValues, type SkillTag } from "@/types/skillBuilder"

type SkillTagMeta = {
  label: string
  bg: string
  border: string
  text: string
  cardC1: string
  cardC2: string
  cardC3: string
  cardGlow: string
  cardBorder: string
}

const SKILL_TAG_META: Record<SkillTag, SkillTagMeta> = {
  ice: {
    label: "Gelo", bg: "#dff7ff", border: "#80d9ff", text: "#0b4f6c",
    cardC1: "#0b2742", cardC2: "#113e64", cardC3: "#15547e", cardGlow: "rgba(73, 181, 255, 0.35)", cardBorder: "#2f6f98",
  },
  water: {
    label: "Agua", bg: "#d9ecff", border: "#7fb6ff", text: "#123e7a",
    cardC1: "#081f3f", cardC2: "#0e3563", cardC3: "#144b84", cardGlow: "rgba(68, 136, 255, 0.35)", cardBorder: "#2d5e9b",
  },
  wind: {
    label: "Vento", bg: "#e8fff4", border: "#86e6bf", text: "#14664b",
    cardC1: "#0b2a24", cardC2: "#124538", cardC3: "#17614a", cardGlow: "rgba(85, 219, 168, 0.33)", cardBorder: "#2d7d61",
  },
  earth: {
    label: "Terra", bg: "#f7ecd9", border: "#d7b27a", text: "#6a4a1d",
    cardC1: "#2a1e14", cardC2: "#46311f", cardC3: "#5f4327", cardGlow: "rgba(201, 145, 88, 0.35)", cardBorder: "#7a5632",
  },
  light: {
    label: "Luz", bg: "#fff9d8", border: "#e8cf62", text: "#6c5700",
    cardC1: "#3b2f12", cardC2: "#594616", cardC3: "#775b18", cardGlow: "rgba(255, 206, 90, 0.36)", cardBorder: "#8d6a1b",
  },
  dark: {
    label: "Escuridao", bg: "#e7e3f7", border: "#9f92cf", text: "#352560",
    cardC1: "#1b1533", cardC2: "#2a2150", cardC3: "#3a2d6a", cardGlow: "rgba(143, 120, 235, 0.34)", cardBorder: "#5943a3",
  },
  shadow: {
    label: "Sombra", bg: "#e8e8f0", border: "#9aa0b9", text: "#30354b",
    cardC1: "#1a1d2c", cardC2: "#272c3d", cardC3: "#343b50", cardGlow: "rgba(122, 132, 167, 0.34)", cardBorder: "#505a7a",
  },
  infernal: {
    label: "Infernal", bg: "#ffe2dc", border: "#ff9f8c", text: "#7a2215",
    cardC1: "#3d120f", cardC2: "#631c16", cardC3: "#89271d", cardGlow: "rgba(255, 91, 64, 0.38)", cardBorder: "#a53929",
  },
  holy: {
    label: "Sagrado", bg: "#fff1d9", border: "#e7bf76", text: "#6b4f10",
    cardC1: "#3a2b12", cardC2: "#584018", cardC3: "#76551c", cardGlow: "rgba(255, 192, 97, 0.36)", cardBorder: "#936826",
  },
  poison: {
    label: "Veneno", bg: "#e3f8dc", border: "#9ed084", text: "#2f6115",
    cardC1: "#1c3212", cardC2: "#2a4b18", cardC3: "#38671e", cardGlow: "rgba(122, 214, 94, 0.34)", cardBorder: "#4f8e2f",
  },
  blood: {
    label: "Sangue", bg: "#ffdfe5", border: "#ff8ea0", text: "#7a1630",
    cardC1: "#3b0f1f", cardC2: "#5d162f", cardC3: "#7f1f3f", cardGlow: "rgba(255, 96, 132, 0.36)", cardBorder: "#9e2a52",
  },
  psychic: {
    label: "Psiquico", bg: "#efe2ff", border: "#be97f8", text: "#4a237e",
    cardC1: "#27153e", cardC2: "#3d2060", cardC3: "#542a82", cardGlow: "rgba(186, 118, 255, 0.35)", cardBorder: "#6d39a4",
  },
  time: {
    label: "Tempo", bg: "#fff1dc", border: "#f0bf74", text: "#714400",
    cardC1: "#352114", cardC2: "#56331c", cardC3: "#744525", cardGlow: "rgba(255, 164, 77, 0.36)", cardBorder: "#91572f",
  },
  sound: {
    label: "Som", bg: "#e0f4ff", border: "#89c6eb", text: "#0f4d70",
    cardC1: "#0f2531", cardC2: "#183846", cardC3: "#224c5c", cardGlow: "rgba(95, 193, 241, 0.34)", cardBorder: "#2f6678",
  },
  arcane: {
    label: "Arcano", bg: "#eee5ff", border: "#b8a0f6", text: "#43257f",
    cardC1: "#24133a", cardC2: "#37205a", cardC3: "#4b2d78", cardGlow: "rgba(160, 128, 255, 0.35)", cardBorder: "#603a97",
  },
  void: {
    label: "Vazio", bg: "#dedce8", border: "#9a95ac", text: "#2f2b40",
    cardC1: "#15141d", cardC2: "#201f2a", cardC3: "#2d2c39", cardGlow: "rgba(124, 118, 153, 0.34)", cardBorder: "#47445a",
  },
  life: {
    label: "Vida", bg: "#e3fae8", border: "#95db9f", text: "#1e6a2d",
    cardC1: "#153018", cardC2: "#1f4825", cardC3: "#296133", cardGlow: "rgba(97, 214, 123, 0.34)", cardBorder: "#387c43",
  },
  death: {
    label: "Morte", bg: "#ebdde0", border: "#b2989f", text: "#4f3038",
    cardC1: "#27171c", cardC2: "#3b222a", cardC3: "#502d37", cardGlow: "rgba(167, 116, 132, 0.34)", cardBorder: "#663a47",
  },
  energy: {
    label: "Energia", bg: "#fff4d9", border: "#e9c063", text: "#724e00",
    cardC1: "#35270f", cardC2: "#523a12", cardC3: "#6e4e15", cardGlow: "rgba(255, 189, 67, 0.36)", cardBorder: "#88601a",
  },
}

export function normalizeSkillTags(input: unknown): SkillTag[] {
  if (!Array.isArray(input)) return []
  const unique = new Set<SkillTag>()

  for (const value of input) {
    if (typeof value !== "string") continue
    if (!skillTagValues.includes(value as SkillTag)) continue
    unique.add(value as SkillTag)
  }

  return Array.from(unique)
}

export function getSkillTagMeta(tag: string): SkillTagMeta | null {
  if (!skillTagValues.includes(tag as SkillTag)) return null
  return SKILL_TAG_META[tag as SkillTag]
}
