import type { AuthCookieConfig } from "@/application/auth/types"

export function logoutUseCase(cookie: AuthCookieConfig) {
  return {
    ok: true as const,
    cookie: {
      ...cookie,
      value: "",
      maxAge: 0,
    },
  }
}
