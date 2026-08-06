import type { AuthCookieConfig } from "@/features/auth/application/types"

export function logoutUseCase(cookie: AuthCookieConfig) {
  return {
    ok: true as const,
    cookie: {
      ...cookie,
      value: "",
      maxAge: 0
    }
  }
}
