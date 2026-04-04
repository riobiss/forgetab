import type { AuthPasswordService } from "@/application/auth/ports/AuthPasswordService"
import { comparePassword, hashPassword } from "@/lib/auth/password"

export const bcryptAuthPasswordService: AuthPasswordService = {
  compare: comparePassword,
  hash: hashPassword,
}
