import type { AuthPasswordService } from "@/features/auth/application/ports/AuthPasswordService"
import bcrypt from "bcryptjs"

export const bcryptAuthPasswordService: AuthPasswordService = {
  async verify(password, passwordHash) {
    if (!passwordHash) {
      await bcrypt.hash(password, 12)
      return false
    }

    return bcrypt.compare(password, passwordHash)
  },
  hash(password) {
    return bcrypt.hash(password, 12)
  }
}
