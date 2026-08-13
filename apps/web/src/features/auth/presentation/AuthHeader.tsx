"use client"

import Header, { type HeaderLink } from "@/components/header/Header"
import { logoutClientUseCase } from "@/features/auth/application/use-cases/authClient"
import { authClientDependencies } from "@/features/auth/presentation/dependencies"
import { usePathname } from "next/navigation"

const HIDDEN_ROUTES = new Set(["/login", "/register", "/offline"])

export default function AuthHeader() {
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter(Boolean)
  const rpgSegmentIndex = pathSegments.indexOf("rpg")
  const routeRpgId =
    rpgSegmentIndex >= 0 &&
    pathSegments[rpgSegmentIndex + 1] &&
    pathSegments[rpgSegmentIndex + 1] !== "novo"
      ? pathSegments[rpgSegmentIndex + 1]
      : null
  const navLinks: HeaderLink[] = [
    { href: "/", label: "Início" },
    { href: "/rpg", label: "Campanhas" },
    { href: "/dices", label: "Dados" },
    ...(routeRpgId
      ? [{ href: `/rpg/${routeRpgId}/skills`, label: "Habilidades" }]
      : []),
    { href: "/docs", label: "Guias" }
  ]

  if (HIDDEN_ROUTES.has(pathname)) {
    return null
  }

  return (
    <Header
      navLinks={navLinks}
      campaignLink={
        routeRpgId
          ? { href: `/rpg/${routeRpgId}`, label: "Campanha" }
          : undefined
      }
      profileHref="/profile"
      loginHref="/login"
      onLogout={async () => {
        try {
          await logoutClientUseCase(authClientDependencies)
        } finally {
          window.location.replace("/login")
        }
      }}
    />
  )
}
