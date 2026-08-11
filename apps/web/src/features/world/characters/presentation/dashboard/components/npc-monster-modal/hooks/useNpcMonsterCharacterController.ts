import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
  UpdateCharacterPayloadDto,
  UpsertCharacterPayloadDto
} from "@/features/world/characters/application/editor"
import {
  createCharacterUseCase,
  deleteCharacterImageByUrlUseCase,
  deleteCharacterUseCase,
  loadCharacterEditorBootstrapUseCase,
  loadEditableCharacterUseCase,
  updateCharacterUseCase,
  uploadCharacterImageUseCase
} from "@/features/world/characters/application/editor"
import {
  buildNpcMonsterBasicUpdatePayload,
  buildNpcMonsterBonusUpdatePayload,
  buildNpcMonsterCreatePayload
} from "@/features/world/characters/application/npc-monster"
import { createCharactersEditorDependencies } from "@/features/world/characters/presentation/editor/dependencies"
import { mergeCharacterSnapshot, upsertCharacterSnapshot } from "../characterSnapshot"
import type { StepKey } from "../types"
import { useNpcMonsterFormState } from "./useNpcMonsterFormState"
import { useNpcMonsterLoadout } from "./useNpcMonsterLoadout"

const deps = createCharactersEditorDependencies("http")

type Params = {
  rpgId: string
  isOpen: boolean
  mode: "create" | "edit"
  characterType: "npc" | "monster"
  characterId?: string | null
  initialBootstrap?: CharacterEditorBootstrapDto | null
  onClose: () => void
}

export function useNpcMonsterCharacterController({
  rpgId,
  isOpen,
  mode,
  characterType,
  characterId,
  initialBootstrap = null,
  onClose
}: Params) {
  const router = useRouter()
  const form = useNpcMonsterFormState()
  const { hydrate, resetTransient } = form
  const [step, setStep] = useState<StepKey>("basic")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [bootstrap, setBootstrap] =
    useState<CharacterEditorBootstrapDto | null>(null)
  const [editingCharacter, setEditingCharacter] =
    useState<CharacterEditorSummaryDto | null>(null)
  const [createdCharacterId, setCreatedCharacterId] = useState<string | null>(
    characterId ?? null
  )
  const loadout = useNpcMonsterLoadout({
    isOpen,
    rpgId,
    characterId: createdCharacterId
  })

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    async function loadBootstrap() {
      try {
        setLoading(true)
        setError("")
        setStep("basic")
        const [payload, targetCharacter] =
          mode === "edit" && characterId
            ? await Promise.all([
                loadCharacterEditorBootstrapUseCase(deps, {
                  rpgId,
                  includeCharacters: false
                }),
                loadEditableCharacterUseCase(deps, { rpgId, characterId })
              ])
            : [
                initialBootstrap ??
                  (await loadCharacterEditorBootstrapUseCase(deps, {
                    rpgId,
                    includeCharacters: true
                  })),
                null
              ]
        if (cancelled) return

        const target = targetCharacter ?? null
        const nextBootstrap =
          target &&
          !payload.characters.some((character) => character.id === target.id)
            ? { ...payload, characters: [target, ...payload.characters] }
            : payload
        const snapshot = hydrate(nextBootstrap, target)
        setBootstrap(snapshot.bootstrap)
        setEditingCharacter(snapshot.editingCharacter)
        setCreatedCharacterId(snapshot.createdCharacterId)
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Nao foi possivel carregar o formulario."
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadBootstrap()
    return () => {
      cancelled = true
    }
  }, [
    characterId,
    hydrate,
    initialBootstrap,
    isOpen,
    mode,
    rpgId
  ])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) return
    setBootstrap(null)
    setEditingCharacter(null)
    setCreatedCharacterId(characterId ?? null)
    setError("")
    resetTransient()
  }, [characterId, isOpen, resetTransient])

  function applyLocalCharacterSnapshot(nextCharacter: CharacterEditorSummaryDto) {
    if (!bootstrap) return
    const nextBootstrap = upsertCharacterSnapshot(bootstrap, nextCharacter)
    const snapshot = hydrate(nextBootstrap, nextCharacter)
    setBootstrap(snapshot.bootstrap)
    setEditingCharacter(snapshot.editingCharacter)
    setCreatedCharacterId(snapshot.createdCharacterId)
  }

  async function persistCharacter(
    payload: UpsertCharacterPayloadDto | UpdateCharacterPayloadDto,
    successMessage: string
  ) {
    const targetCharacterId = createdCharacterId
    const saved = targetCharacterId
      ? await updateCharacterUseCase(deps, {
          rpgId,
          characterId: targetCharacterId,
          payload
        })
      : await createCharacterUseCase(deps, {
          rpgId,
          payload: payload as UpsertCharacterPayloadDto
        })
    applyLocalCharacterSnapshot(
      mergeCharacterSnapshot(editingCharacter, payload, saved)
    )
    toast.success(successMessage)
  }

  async function submitBasic() {
    if (!bootstrap) return
    setSaving(true)
    setError("")
    let uploadedImageUrl = ""
    let submittedImage = form.image.trim() || null

    try {
      if (form.selectedImageFile) {
        const upload = await uploadCharacterImageUseCase(deps, {
          file: form.selectedImageFile
        })
        uploadedImageUrl = upload.url
        submittedImage = upload.url
      }
      const basic = { ...form.formState, image: submittedImage ?? "" }
      const payload =
        createdCharacterId || mode === "edit"
          ? buildNpcMonsterBasicUpdatePayload({
              currentCharacter: editingCharacter,
              basic
            })
          : buildNpcMonsterCreatePayload({
              currentCharacter: editingCharacter,
              characterType,
              basic,
              bonus: {
                statusValues: form.statusValues,
                attributeValues: form.attributeValues,
                skillValues: form.skillValues
              }
            })
      await persistCharacter(
        payload,
        mode === "edit" || createdCharacterId
          ? "Personagem salvo com sucesso."
          : "Personagem criado com sucesso."
      )
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : mode === "edit"
            ? "Nao foi possivel salvar o personagem."
            : "Nao foi possivel criar o personagem."
      if (uploadedImageUrl) {
        try {
          await deleteCharacterImageByUrlUseCase(deps, {
            url: uploadedImageUrl
          })
        } catch {
          // A falha de limpeza nao substitui o erro original.
        }
      }
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function submitBonus() {
    if (!createdCharacterId) return
    try {
      setSaving(true)
      setError("")
      await persistCharacter(
        buildNpcMonsterBonusUpdatePayload({
          statusValues: form.statusValues,
          attributeValues: form.attributeValues,
          skillValues: form.skillValues
        }),
        "Bonus salvos com sucesso."
      )
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Nao foi possivel salvar os bonus do personagem."
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteCharacter() {
    if (!createdCharacterId || deleting || saving) return
    if (!window.confirm("Tem certeza que deseja deletar este personagem?")) {
      return
    }
    try {
      setDeleting(true)
      setError("")
      await deleteCharacterUseCase(deps, {
        rpgId,
        characterId: createdCharacterId
      })
      toast.success("Personagem deletado com sucesso.")
      router.refresh()
      onClose()
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Nao foi possivel deletar o personagem."
      setError(message)
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  return {
    ...form,
    ...loadout,
    step,
    loading,
    saving,
    deleting,
    error,
    bootstrap,
    createdCharacterId,
    canAdvance: createdCharacterId !== null,
    setStep,
    clearError: () => setError(""),
    close() {
      if (!saving) onClose()
    },
    submitBasic,
    submitBonus,
    deleteCharacter
  }
}
