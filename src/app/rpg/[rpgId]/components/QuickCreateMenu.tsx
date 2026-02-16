"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ChevronDown, Plus } from "lucide-react"
import styles from "../page.module.css"

type Props = {
  rpgId: string
}

export default function QuickCreateMenu({ rpgId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current) return

      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  return (
    <div ref={wrapperRef} className={styles.quickCreateWrapper}>
      <button
        type="button"
        className={styles.quickCreateTrigger}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Criar novo"
        title="Criar novo"
      >
        <Plus size={16} />
        <ChevronDown size={14} className={isOpen ? styles.quickCreateChevronOpen : ""} />
      </button>

      {isOpen ? (
        <div className={styles.quickCreateMenu}>
          <Link href={`/rpg/${rpgId}/characters/novo`} onClick={() => setIsOpen(false)}>
            Criar Personagem
          </Link>
          <Link href={`/rpg/${rpgId}/edit`} onClick={() => setIsOpen(false)}>
            Criar Raca
          </Link>
          <Link href={`/rpg/${rpgId}/characters/skills`} onClick={() => setIsOpen(false)}>
            Criar Habilidade
          </Link>
          <Link href={`/rpg/${rpgId}/items/new`} onClick={() => setIsOpen(false)}>
            Criar Item
          </Link>
        </div>
      ) : null}
    </div>
  )
}
