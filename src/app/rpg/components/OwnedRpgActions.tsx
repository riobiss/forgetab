"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FolderOpen, LoaderCircle, Pencil, Trash2 } from "lucide-react"
import { IconButton } from "@/components/button"
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
      <Link href={`/rpg/${rpgId}`}>
        <FolderOpen size={14} />
        <span>Abrir</span>
      </Link>
      <Link href={`/rpg/${rpgId}/edit`}>
        <Pencil size={14} />
        <span>Editar RPG</span>
      </Link>
      <IconButton
        type="button"
        className={styles.deleteButton}
        onClick={handleDelete}
        disabled={deleting}
        icon={<Trash2 size={14} />}
        loading={deleting}
        loadingIcon={<LoaderCircle size={14} className={styles.spin} />}
      >
        {deleting ? "Deletando..." : "Deletar"}
      </IconButton>
    </div>
  )
}
