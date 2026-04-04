import type { AuthUser, AuthUserSummary } from "@/application/auth/types"

export type CreateAuthUserInput = {
  name: string
  username: string
  email: string
  passwordHash: string
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUser | null>
  findUserByUsername(username: string): Promise<Pick<AuthUser, "id"> | null>
  createUser(input: CreateAuthUserInput): Promise<AuthUserSummary>
}
