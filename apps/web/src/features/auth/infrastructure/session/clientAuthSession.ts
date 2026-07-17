import { TOKEN_COOKIE_NAME } from "@/lib/auth/constants"

function buildCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null
  }

  const prefix = `${name}=`
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  if (!entry) {
    return null
  }

  return decodeURIComponent(entry.slice(prefix.length))
}

export function getClientAuthToken() {
  return buildCookieValue(TOKEN_COOKIE_NAME)
}

export function persistClientAuthSession(token: string, maxAge: number) {
  if (typeof document === "undefined") {
    return
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

export function clearClientAuthSession() {
  if (typeof document === "undefined") {
    return
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}
