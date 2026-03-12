"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { FolderOpen, LoaderCircle, Pencil, Trash2 } from "lucide-react"
import { IconButton } from "@/components/button"
import type { RpgCatalogDependencies } from "@/application/rpgCatalog/contracts/RpgCatalogDependencies"
import { deleteRpgUseCase } from "@/application/rpgCatalog/use-cases/rpgCatalog"
import { dismissToast } from "@/lib/toast"
import styles from "../RpgCatalogPage.module.css"

type Props = {
  deps: RpgCatalogDependencies
  rpgId: string
}

export default function OwnedRpgActions({ deps, rpgId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (deleting) return
    const confirmed = window.confirm("Tem certeza que deseja deletar este RPG?")
    if (!confirmed) return

    try {
      setDeleting(true)
      const loadingToastId = toast.loading("Deletando RPG...")
      await deleteRpgUseCase(deps, { rpgId })
      dismissToast(loadingToastId)
      toast.success("RPG deletado com sucesso.")
      router.refresh()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Nao foi possivel deletar o RPG."
      toast.error(message)
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
