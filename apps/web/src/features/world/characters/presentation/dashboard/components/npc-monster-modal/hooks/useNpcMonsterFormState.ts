import { useCallback, useMemo, useState, type SetStateAction } from "react"
import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto
} from "@forgetab/world-contracts/character-editor"
import type {
  ExtraField,
  NarrativeStatus,
  NumericInputValue,
  SecretFieldKey
} from "../types"
import {
  buildNpcMonsterFormState,
  buildNpcMonsterSecretFieldOptions,
  getNpcMonsterImageStatusText
} from "../presentation"
import {
  buildCharacterSnapshot,
  createEmptyExtraField,
  parseNumericInputValue
} from "../utils"

type FormData = {
  image: string
  selectedImageFile: File | null
  selectedImageName: string
  name: string
  titleNickname: string
  description: string
  visibility: "private" | "public"
  narrativeStatus: NarrativeStatus
  secretFieldKeys: SecretFieldKey[]
  raceLabel: string
  classLabel: string
  statusValues: Record<string, NumericInputValue>
  attributeValues: Record<string, NumericInputValue>
  skillValues: Record<string, NumericInputValue>
  extraFields: ExtraField[]
}

const initialFormData = (): FormData => ({
  image: "",
  selectedImageFile: null,
  selectedImageName: "",
  name: "",
  titleNickname: "",
  description: "",
  visibility: "public",
  narrativeStatus: "vivo",
  secretFieldKeys: [],
  raceLabel: "",
  classLabel: "",
  statusValues: {},
  attributeValues: {},
  skillValues: {},
  extraFields: [createEmptyExtraField()]
})

export function useNpcMonsterFormState() {
  const [form, setForm] = useState<FormData>(initialFormData)
  const [customField, setCustomField] = useState({
    open: false,
    key: "",
    value: ""
  })

  const setField = <Key extends keyof FormData>(
    key: Key,
    value: SetStateAction<FormData[Key]>
  ) => {
    setForm((current) => ({
      ...current,
      [key]:
        typeof value === "function"
          ? (value as (previous: FormData[Key]) => FormData[Key])(current[key])
          : value
    }))
  }

  const hydrate = useCallback(
    (
      bootstrap: CharacterEditorBootstrapDto,
      target: CharacterEditorSummaryDto | null
    ) => {
      const snapshot = buildCharacterSnapshot(bootstrap, target)
      setForm({
        image: snapshot.image,
        selectedImageFile: snapshot.selectedImageFile,
        selectedImageName: snapshot.selectedImageName,
        name: snapshot.name,
        titleNickname: snapshot.titleNickname,
        description: snapshot.description,
        visibility: snapshot.visibility,
        narrativeStatus: snapshot.narrativeStatus,
        secretFieldKeys: snapshot.secretFieldKeys,
        raceLabel: snapshot.raceLabel,
        classLabel: snapshot.classLabel,
        statusValues: snapshot.statusValues,
        attributeValues: snapshot.attributeValues,
        skillValues: snapshot.skillValues,
        extraFields: snapshot.extraFields
      })
      setCustomField({ open: false, key: "", value: "" })
      return snapshot
    },
    []
  )

  const resetTransient = useCallback(() => {
    setForm((current) => ({
      ...current,
      selectedImageFile: null,
      selectedImageName: "",
      statusValues: {},
      attributeValues: {},
      skillValues: {},
      secretFieldKeys: []
    }))
  }, [])

  const updateNumericValue = (
    field: "statusValues" | "attributeValues" | "skillValues",
    key: string,
    value: string
  ) =>
    setField(field, (current) => ({
      ...current,
      [key]: parseNumericInputValue(value)
    }))

  const formState = useMemo(
    () =>
      buildNpcMonsterFormState({
        name: form.name,
        titleNickname: form.titleNickname,
        description: form.description,
        visibility: form.visibility,
        narrativeStatus: form.narrativeStatus,
        secretFieldKeys: form.secretFieldKeys,
        raceLabel: form.raceLabel,
        classLabel: form.classLabel,
        image: form.image,
        statusValues: form.statusValues,
        attributeValues: form.attributeValues,
        skillValues: form.skillValues,
        extraFields: form.extraFields
      }),
    [form]
  )

  return {
    ...form,
    formState,
    imageStatusText: getNpcMonsterImageStatusText(
      form.image,
      form.selectedImageName
    ),
    secretFieldOptions: buildNpcMonsterSecretFieldOptions(form.extraFields),
    customFieldModalOpen: customField.open,
    newFieldKey: customField.key,
    newFieldValue: customField.value,
    hydrate,
    resetTransient,
    setImage: (value: SetStateAction<string>) => setField("image", value),
    setSelectedImageFile: (value: SetStateAction<File | null>) =>
      setField("selectedImageFile", value),
    setSelectedImageName: (value: SetStateAction<string>) =>
      setField("selectedImageName", value),
    setName: (value: SetStateAction<string>) => setField("name", value),
    setTitleNickname: (value: SetStateAction<string>) =>
      setField("titleNickname", value),
    setDescription: (value: SetStateAction<string>) =>
      setField("description", value),
    setVisibility: (value: SetStateAction<"private" | "public">) =>
      setField("visibility", value),
    setNarrativeStatus: (value: SetStateAction<NarrativeStatus>) =>
      setField("narrativeStatus", value),
    setSecretFieldKeys: (value: SetStateAction<SecretFieldKey[]>) =>
      setField("secretFieldKeys", value),
    setRaceLabel: (value: SetStateAction<string>) =>
      setField("raceLabel", value),
    setClassLabel: (value: SetStateAction<string>) =>
      setField("classLabel", value),
    setExtraFields: (value: SetStateAction<ExtraField[]>) =>
      setField("extraFields", value),
    updateAttributeValue: (key: string, value: string) =>
      updateNumericValue("attributeValues", key, value),
    updateStatusValue: (key: string, value: string) =>
      updateNumericValue("statusValues", key, value),
    updateSkillValue: (key: string, value: string) =>
      updateNumericValue("skillValues", key, value),
    openCustomFieldModal: () =>
      setCustomField((current) => ({ ...current, open: true })),
    closeCustomFieldModal: () =>
      setCustomField((current) => ({ ...current, open: false })),
    setNewFieldKey: (key: string) =>
      setCustomField((current) => ({ ...current, key })),
    setNewFieldValue: (value: string) =>
      setCustomField((current) => ({ ...current, value })),
    addExtraField() {
      const key = customField.key.trim()
      if (!key) return
      setForm((current) => ({
        ...current,
        extraFields: [
          ...current.extraFields.filter(
            (item) => item.key.trim() || item.value.trim()
          ),
          { id: crypto.randomUUID(), key, value: customField.value.trim() }
        ]
      }))
      setCustomField({ open: false, key: "", value: "" })
    }
  }
}
