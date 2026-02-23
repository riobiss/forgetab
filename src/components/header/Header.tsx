"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, User, X } from "lucide-react"
import styles from "./Header.module.css"

const HIDDEN_ROUTES = new Set(["/login", "/register", "/cadastro"])

export default function Header() {
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter(Boolean)
  const rpgSegmentIndex = pathSegments.indexOf("rpg")
  const routeRpgId =
    rpgSegmentIndex >= 0 && pathSegments[rpgSegmentIndex + 1] && pathSegments[rpgSegmentIndex + 1] !== "novo"
      ? pathSegments[rpgSegmentIndex + 1]
      : null
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [openNav, setOpenNav] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef<HTMLLIElement | null>(null)
  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/rpg", label: "Campanhas" },
    { href: "/combat", label: "Combate" },
    { href: "/dashboard/skills", label: "Habilidades" },
    { href: "/docs", label: "Guias" },
  ]

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
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      })
    } finally {
      setOpenUserMenu(false)
      window.location.replace("/login")
      setLoggingOut(false)
    }
  }

  function closeMenus() {
    setOpenUserMenu(false)
    setOpenNav(false)
  }

  if (HIDDEN_ROUTES.has(pathname)) {
    return null
  }

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} onClick={closeMenus}>
        ForgeTab
      </Link>
      <nav className={`${styles.nav} ${openNav ? styles.navOpen : ""}`}>
        <ul className={styles.navList}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={closeMenus}>
                {link.label}
              </Link>
            </li>
          ))}

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
                <Link href="/perfil" onClick={closeMenus}>
                  Perfil
                </Link>
                <Link href="/login" onClick={closeMenus}>
                  Login
                </Link>
                <button type="button" onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? "Saindo..." : "Deslogar"}
                </button>
              </div>
            ) : null}
          </li>
        </ul>
      </nav>
      <div className={styles.quickActions}>
        {routeRpgId ? (
          <Link href={`/rpg/${routeRpgId}`} className={styles.campaignButton} onClick={closeMenus}>
            Campanha
          </Link>
        ) : null}
        <button
          type="button"
          className={styles.menuToggle}
          aria-label={openNav ? "Fechar menu de navegação" : "Abrir menu de navegação"}
          aria-expanded={openNav}
          onClick={() => setOpenNav((prev) => !prev)}
        >
          {openNav ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}
