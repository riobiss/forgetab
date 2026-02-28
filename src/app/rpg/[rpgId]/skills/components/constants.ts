import type { ActionType, SkillTag, SkillType } from "@/types/skillBuilder"

export const actionTypeLabel: Record<ActionType, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva",
}

export const skillTypeLabel: Record<SkillType, string> = {
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
  resource: "Recurso",
}

export const skillTagLabel: Record<SkillTag, string> = {
  ice: "Gelo",
  water: "Agua",
  wind: "Vento",
  earth: "Terra",
  light: "Luz",
  dark: "Escuridao",
  shadow: "Sombra",
  infernal: "Infernal",
  holy: "Sagrado",
  poison: "Veneno",
  blood: "Sangue",
  psychic: "Psiquico",
  time: "Tempo",
  sound: "Som",
  arcane: "Arcano",
  void: "Vazio",
  life: "Vida",
  death: "Morte",
  energy: "Energia",
}
