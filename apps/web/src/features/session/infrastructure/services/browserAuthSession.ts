import type { AuthClientSession } from "@/features/session/application/ports/AuthClientSession"
import { SESSION_COOKIE_NAME } from "@/features/session/domain/sessionConfig"

function readCookie(name: string) {
  if (typeof document === "undefined") return null

  const prefix = `${name}=`
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null
}

function writeSessionCookie(value: string, maxAge: number) {
  if (typeof document === "undefined") return

  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

export function getBrowserAuthToken() {
  return readCookie(SESSION_COOKIE_NAME)
}

export const browserAuthSession: AuthClientSession = {
  persist(token, maxAge) {
    writeSessionCookie(token, maxAge)
  },
  clear() {
    writeSessionCookie("", 0)
  }
}
