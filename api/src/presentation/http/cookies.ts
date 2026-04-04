type CookieOptions = {
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: "lax" | "strict" | "none"
  secure?: boolean
}

function encodeCookieValue(value: string) {
  return encodeURIComponent(value)
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}) {
  const parts = [`${name}=${encodeCookieValue(value)}`]

  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${options.maxAge}`)
  }

  parts.push(`Path=${options.path ?? "/"}`)

  if (options.httpOnly !== false) {
    parts.push("HttpOnly")
  }

  parts.push(`SameSite=${options.sameSite ?? "Lax"}`)

  if (options.secure) {
    parts.push("Secure")
  }

  return parts.join("; ")
}
