"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"
import styles from "./Header.module.css"

export default function Header() {
  const router = useRouter()
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const menuRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current) return

      if (!menuRef.current.contains(event.target as Node)) {
        setOpenUserMenu(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      setOpenUserMenu(false)
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <header className={styles.header}>
      <h1>ForgeTab</h1>
      <nav>
        <ul>
          <li>
            <Link href="/">Inicio</Link>
          </li>

          <li>
            <Link href="/rpg">Campanhas</Link>
          </li>

          <li className={styles.userMenu} ref={menuRef}>
            <button
              type="button"
              className={styles.userButton}
              onClick={() => setOpenUserMenu((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={openUserMenu}
              aria-label="Abrir menu do usuario"
            >
              <User size={16} aria-hidden="true" />
            </button>

            {openUserMenu ? (
              <div className={styles.dropdown}>
                <Link href="/perfil" onClick={() => setOpenUserMenu(false)}>
                  Perfil
                </Link>
                <button type="button" onClick={handleLogout}>
                  Deslogar
                </button>
              </div>
            ) : null}
          </li>
        </ul>
      </nav>
    </header>
  )
}
