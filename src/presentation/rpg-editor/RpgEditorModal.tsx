"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import RpgEditorFeature from "@/presentation/rpg-editor/RpgEditorFeature"
import styles from "@/presentation/rpg-editor/RpgEditorModal.module.css"

type RpgEditorModalProps =
  | {
      isOpen: boolean
      mode: "create"
      onClose: () => void
    }
  | {
      isOpen: boolean
      mode: "edit"
      onClose: () => void
    }

export default function RpgEditorModal(props: RpgEditorModalProps) {
  const router = useRouter()

  useEffect(() => {
    if (!props.isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [props.isOpen])

  if (!props.isOpen) {
    return null
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Editor de RPG">
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <p className={styles.eyebrow}>RPG</p>
            <h2 className={styles.title}>
              {props.mode === "create" ? "Criar RPG" : "Configurar RPG"}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Fechar editor de RPG"
            onClick={props.onClose}
          >
            <X size={16} />
          </button>
        </header>

        {props.mode === "create" ? (
          <RpgEditorFeature
            mode="create"
            presentation="embedded"
            onCancel={props.onClose}
            onCompleted={props.onClose}
          />
        ) : (
          <RpgEditorFeature
            mode="edit"
            presentation="embedded"
            onClose={props.onClose}
            onSaved={() => router.refresh()}
            onDeleted={props.onClose}
          />
        )}
      </section>
    </div>
  )
}
