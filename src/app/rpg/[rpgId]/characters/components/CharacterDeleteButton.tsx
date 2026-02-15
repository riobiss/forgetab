"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import styles from "../page.module.css"

type Props = {
  rpgId: string
  characterId: string
}

export default function CharacterDeleteButton({ rpgId, characterId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm("Tem certeza que deseja deletar este personagem?")
    if (!confirmed) return

    try {
      setDeleting(true)

      const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string }
        window.alert(payload.message ?? "Nao foi possivel deletar o personagem.")
        return
      }

      router.refresh()
    } catch {
      window.alert("Erro de conexao ao deletar personagem.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      className={styles.deleteButton}
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? "Deletando..." : "Deletar"}
    </button>
  )
}
