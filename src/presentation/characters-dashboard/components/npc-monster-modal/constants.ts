import type { ReactSelectOption } from "@/components/select/ReactSelectField"
import type { StepKey } from "./types"

export const npcMonsterSteps: Array<{ key: StepKey; label: string }> = [
  { key: "basic", label: "Basico" },
  { key: "bonus", label: "Bonus" },
  { key: "inventory", label: "Inventory" },
  { key: "abilities", label: "Habilidades" },
]

export const visibilityOptions: ReactSelectOption[] = [
  { value: "public", label: "Publico" },
  { value: "private", label: "Privado" },
]

export const narrativeStatusOptions: ReactSelectOption[] = [
  { value: "vivo", label: "Vivo" },
  { value: "morto", label: "Morto" },
  { value: "desaparecido", label: "Desaparecido" },
  { value: "secreto", label: "Secreto" },
]
