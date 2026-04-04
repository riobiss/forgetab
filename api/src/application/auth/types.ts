export type AuthUser = {
  id: string
  name: string
  username: string
  email: string
  passwordHash: string
  createdAt: Date
}

export type AuthUserSummary = Omit<AuthUser, "passwordHash">

export type AuthRateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export type AuthCookieConfig = {
  name: string
  maxAge: number
}
