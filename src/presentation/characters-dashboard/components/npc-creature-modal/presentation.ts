import type { ReactSelectOption } from "@/components/select/ReactSelectField"
import type {
  ExtraField,
  NarrativeStatus,
  NpcCreatureFormState,
  NumericInputValue,
  SecretFieldKey,
} from "./types"

type BuildNpcCreatureFormStateParams = {
  name: string
  titleNickname: string
  description: string
  visibility: "private" | "public"
  narrativeStatus: NarrativeStatus
  secretFieldKeys: SecretFieldKey[]
  raceLabel: string
  classLabel: string
  image: string
  statusValues: Record<string, NumericInputValue>
  attributeValues: Record<string, NumericInputValue>
  skillValues: Record<string, NumericInputValue>
  extraFields: ExtraField[]
}

export function getNpcCreatureImageStatusText(image: string, selectedImageName: string) {
  return selectedImageName || image.split("/").pop() || ""
}

export function buildNpcCreatureSecretFieldOptions(extraFields: ExtraField[]): ReactSelectOption[] {
  return [
    { value: "name", label: "Nome" },
    { value: "titleNickname", label: "Titulo / Apelido" },
    { value: "description", label: "Descricao" },
    { value: "visibility", label: "Visibilidade" },
    { value: "narrativeStatus", label: "Status narrativo" },
    { value: "raceLabel", label: "Raca" },
    { value: "classLabel", label: "Classe" },
    { value: "statuses", label: "Status" },
    { value: "attributes", label: "Atributos" },
    { value: "skills", label: "Pericias" },
    ...extraFields
      .filter((field) => field.key.trim().length > 0)
      .map((field) => ({
        value: `extra:${field.key.trim()}`,
        label: field.key.trim(),
      })),
  ]
}

export function buildNpcCreatureFormState(
  params: BuildNpcCreatureFormStateParams,
): NpcCreatureFormState {
  return {
    name: params.name,
    titleNickname: params.titleNickname,
    description: params.description,
    visibility: params.visibility,
    narrativeStatus: params.narrativeStatus,
    secretFieldKeys: params.secretFieldKeys,
    raceLabel: params.raceLabel,
    classLabel: params.classLabel,
    image: params.image,
    statusValues: params.statusValues,
    attributeValues: params.attributeValues,
    skillValues: params.skillValues,
    extraFields: params.extraFields,
  }
}
