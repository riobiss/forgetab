"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Settings } from "lucide-react"
import RpgEditorModal from "@/presentation/rpg-editor/RpgEditorModal"
import styles from "@/presentation/rpg-dashboard/RpgDashboardPage.module.css"

type Props = {
  rpgId: string
}

export default function RpgDashboardEditorLauncher({ rpgId }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const modal = searchParams.get("modal")
  const editor = searchParams.get("editor")
  const isOpen = modal === "edit" && editor === "rpg"

  const editHref = (() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("modal", "edit")
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
      <Link
        href={editHref}
        className={styles.settingsButton}
        aria-label="Configurar RPG"
        title="Configurar RPG"
      >
        <Settings size={18} />
      </Link>

      <RpgEditorModal key={rpgId} isOpen={isOpen} mode="edit" onClose={handleClose} />
    </>
  )
}
