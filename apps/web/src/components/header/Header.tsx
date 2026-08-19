"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Menu, User, X } from "lucide-react"
import styles from "./Header.module.css"

export type HeaderLink = {
  href: string
  label: string
}

type HeaderProps = {
  navLinks: HeaderLink[]
  campaignLink?: HeaderLink
  contextLink?: HeaderLink
  profileHref: string
  loginHref: string
  onLogout: () => Promise<void>
}

export default function Header({
  navLinks,
  campaignLink,
  contextLink,
  profileHref,
  loginHref,
  onLogout
}: HeaderProps) {
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [openNav, setOpenNav] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
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
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setOpenUserMenu(false)
      setLoggingOut(false)
    }
  }

  function closeMenus() {
    setOpenUserMenu(false)
    setOpenNav(false)
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
                <Link href={profileHref} onClick={closeMenus}>
                  Perfil
                </Link>
                <Link href={loginHref} onClick={closeMenus}>
                  Login
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Saindo..." : "Deslogar"}
                </button>
              </div>
            ) : null}
          </li>
        </ul>
      </nav>
      <div className={styles.quickActions}>
        {campaignLink ? (
          <Link
            href={campaignLink.href}
            className={styles.campaignButton}
            onClick={closeMenus}
          >
            {campaignLink.label}
          </Link>
        ) : null}
        {contextLink ? (
          <Link
            href={contextLink.href}
            className={styles.campaignButton}
            onClick={closeMenus}
          >
            {contextLink.label}
          </Link>
        ) : null}
        <button
          type="button"
          className={styles.menuToggle}
          aria-label={
            openNav ? "Fechar menu de navegação" : "Abrir menu de navegação"
          }
          aria-expanded={openNav}
          onClick={() => setOpenNav((prev) => !prev)}
        >
          {openNav ? (
            <X size={18} aria-hidden="true" />
          ) : (
            <Menu size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  )
}
