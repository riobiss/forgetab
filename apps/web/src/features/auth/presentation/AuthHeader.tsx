"use client"

import Header, { type HeaderLink } from "@/components/header/Header"
import { logoutClientUseCase } from "@/features/auth/application/use-cases/authClient"
import { authClientDependencies } from "@/features/auth/presentation/dependencies"
import {
  campaignPath,
  createNotesHref,
  notesPath,
  notesReturnPageLabel,
  resolveNotesReturnPath
} from "@/features/world/notes/presentation/notesNavigation"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const HIDDEN_ROUTES = new Set(["/login", "/register", "/offline"])

export default function AuthHeader() {
  const pathname = usePathname()
  const [returnPageLink, setReturnPageLink] = useState<HeaderLink | undefined>()
  const pathSegments = pathname.split("/").filter(Boolean)
  const rpgSegmentIndex = pathSegments.indexOf("rpg")
  const routeRpgId =
    rpgSegmentIndex >= 0 &&
    pathSegments[rpgSegmentIndex + 1] &&
    !["new", "novo"].includes(pathSegments[rpgSegmentIndex + 1])
      ? pathSegments[rpgSegmentIndex + 1]
      : null
  const currentNotesPath = routeRpgId ? notesPath(routeRpgId) : null
  const isNotesRoute = pathname === currentNotesPath

  useEffect(() => {
    if (!routeRpgId || !isNotesRoute) {
      setReturnPageLink(undefined)
      return
    }

    const candidate = new URLSearchParams(window.location.search).get(
      "returnTo"
    )
    const href = resolveNotesReturnPath(routeRpgId, candidate)
    setReturnPageLink(
      href === campaignPath(routeRpgId)
        ? undefined
        : { href, label: notesReturnPageLabel(routeRpgId, href) }
    )
  }, [isNotesRoute, routeRpgId])

  const navLinks: HeaderLink[] = [
    { href: "/", label: "Início" },
    { href: "/rpg", label: "Campanhas" },
    { href: "/dices", label: "Dados" },
    ...(routeRpgId
      ? [
          {
            href: isNotesRoute
              ? notesPath(routeRpgId)
              : createNotesHref(routeRpgId, pathname),
            label: "Notas"
          },
          { href: `/rpg/${routeRpgId}/skills`, label: "Habilidades" }
        ]
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
      contextLink={returnPageLink}
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
