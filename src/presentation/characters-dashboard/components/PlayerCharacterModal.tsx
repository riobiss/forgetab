"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { CharacterEditorBootstrapDto } from "@/application/characters/editor"
import { CharacterEditorForm, createCharactersEditorDependencies } from "@/presentation/characters/editor"
import styles from "../CharactersDashboardPage.module.css"

type Props = {
  rpgId: string
  characterId?: string
  initialBootstrap?: CharacterEditorBootstrapDto | null
  isOpen: boolean
  onClose: () => void
}

export default function PlayerCharacterModal({
  rpgId,
  characterId,
  initialBootstrap = null,
  isOpen,
  onClose,
}: Props) {
  const router = useRouter()
  const deps = useMemo(() => createCharactersEditorDependencies("http"), [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Editor de personagem">
      <section className={`${styles.modalShell} ${styles.playerModalShell}`}>
        <CharacterEditorForm
          rpgId={rpgId}
          characterId={characterId}
          deps={deps}
          initialBootstrap={initialBootstrap}
          presentation="embedded"
          onCancel={onClose}
          onCompleted={() => {
            onClose()
            router.refresh()
          }}
          onDeleted={() => {
            onClose()
            router.refresh()
          }}
        />
      </section>
    </div>
  )
}
