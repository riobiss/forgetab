import type { AuthPasswordService } from "@/features/auth/application/ports/AuthPasswordService"
import { comparePassword, hashPassword } from "@/lib/auth/password"

export const bcryptAuthPasswordService: AuthPasswordService = {
  compare: comparePassword,
  hash: hashPassword
}
