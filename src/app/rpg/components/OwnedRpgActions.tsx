"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import styles from "../page.module.css"

type Props = {
  rpgId: string
}

export default function OwnedRpgActions({ rpgId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm("Tem certeza que deseja deletar este RPG?")
    if (!confirmed) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/rpg/${rpgId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string }
        window.alert(payload.message ?? "Nao foi possivel deletar o RPG.")
        return
      }

      router.refresh()
    } catch {
      window.alert("Erro de conexao ao deletar RPG.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={styles.createdActions}>
      <Link href={`/rpg/${rpgId}`}>Abrir</Link>
      <Link href={`/rpg/${rpgId}/edit`}>Editar RPG</Link>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Deletando..." : "Deletar"}
      </button>
    </div>
  )
}
