"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"
import RpgEditorModal from "@/presentation/rpg-editor/RpgEditorModal"
import styles from "@/presentation/rpg-catalog/RpgCatalogPage.module.css"

export default function RpgCatalogEditorLauncher() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const modal = searchParams.get("modal")
  const editor = searchParams.get("editor")
  const isOpen = modal === "create" && editor === "rpg"

  const createHref = (() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("modal", "create")
    params.set("editor", "rpg")
    return `${pathname}?${params.toString()}`
  })()

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("modal")
    params.delete("editor")
    const next = params.toString()
    router.push(next ? `${pathname}?${next}` : pathname)
    router.refresh()
  }

  return (
    <>
      <Link href={createHref} className={styles.createButton}>
        <Plus size={16} />
        <span>Criar RPG</span>
      </Link>

      <RpgEditorModal isOpen={isOpen} mode="create" onClose={handleClose} />
    </>
  )
}
